use crate::core::network::errors::NetworkError;
use quinn::{ClientConfig, Connection, Endpoint, ServerConfig};
use rustls::pki_types::{CertificateDer, PrivateKeyDer, PrivatePkcs8KeyDer};
use std::{net::SocketAddr, sync::Arc};

/// Certificate material for a PINC node
pub struct NodeCert {
    pub cert_der: CertificateDer<'static>,
    pub key_der: PrivateKeyDer<'static>,
}

/// Generate a self-signed certificate for this node
pub fn generate_node_cert(node_id: &str) -> Result<NodeCert, NetworkError> {
    let CertifiedKey { cert, key_pair } =
        rcgen::generate_simple_self_signed(vec![node_id.to_string(), "pinc-node".to_string()])
            .map_err(|e| NetworkError::CertError(e.to_string()))?;

    let cert_der = CertificateDer::from(cert.der().to_vec());
    let key_der = PrivateKeyDer::Pkcs8(PrivatePkcs8KeyDer::from(key_pair.serialize_der()));

    Ok(NodeCert { cert_der, key_der })
}

use rcgen::CertifiedKey;

/// Build a Quinn server endpoint bound to addr
pub fn create_server_endpoint(addr: SocketAddr, cert: NodeCert) -> Result<Endpoint, NetworkError> {
    let mut tls = rustls::ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(vec![cert.cert_der], cert.key_der)
        .map_err(|e| NetworkError::TlsConfigFailed(e.to_string()))?;

    tls.alpn_protocols = vec![b"pinc/1".to_vec()];

    let quic_cfg = quinn::crypto::rustls::QuicServerConfig::try_from(tls)
        .map_err(|e| NetworkError::TlsConfigFailed(e.to_string()))?;

    let server_cfg = ServerConfig::with_crypto(Arc::new(quic_cfg));

    Endpoint::server(server_cfg, addr).map_err(|e| NetworkError::BindFailed(e.to_string()))
}

/// Build a Quinn client endpoint (skip cert verification for P2P mesh)
pub fn create_client_endpoint() -> Result<Endpoint, NetworkError> {
    let tls = rustls::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(SkipCertVerification))
        .with_no_client_auth();

    let mut tls = tls;
    tls.alpn_protocols = vec![b"pinc/1".to_vec()];

    let quic_cfg = quinn::crypto::rustls::QuicClientConfig::try_from(tls)
        .map_err(|e| NetworkError::TlsConfigFailed(e.to_string()))?;

    let client_cfg = ClientConfig::new(Arc::new(quic_cfg));

    let mut endpoint = Endpoint::client("0.0.0.0:0".parse().unwrap())
        .map_err(|e| NetworkError::BindFailed(e.to_string()))?;

    endpoint.set_default_client_config(client_cfg);
    Ok(endpoint)
}

/// Connect to a remote PINC node
pub async fn connect_to_node(
    endpoint: &Endpoint,
    addr: SocketAddr,
    server_name: &str,
) -> Result<Connection, NetworkError> {
    let conn = endpoint
        .connect(addr, server_name)
        .map_err(|e| NetworkError::ConnectionFailed {
            addr: addr.to_string(),
            reason: e.to_string(),
        })?
        .await
        .map_err(|e| NetworkError::ConnectionFailed {
            addr: addr.to_string(),
            reason: e.to_string(),
        })?;
    Ok(conn)
}

/// Accept an incoming connection from the server endpoint
pub async fn accept_connection(endpoint: &Endpoint) -> Option<Connection> {
    let incoming = endpoint.accept().await?;
    incoming.await.ok()
}

/// Send a framed message over a QUIC stream
pub async fn send_message(conn: &Connection, msg: &[u8]) -> Result<(), NetworkError> {
    let mut stream = conn
        .open_uni()
        .await
        .map_err(|e| NetworkError::SendFailed(e.to_string()))?;

    // Frame: 4-byte length prefix + payload
    let len = (msg.len() as u32).to_be_bytes();
    stream
        .write_all(&len)
        .await
        .map_err(|e| NetworkError::SendFailed(e.to_string()))?;
    stream
        .write_all(msg)
        .await
        .map_err(|e| NetworkError::SendFailed(e.to_string()))?;
    stream
        .finish()
        .map_err(|e| NetworkError::SendFailed(e.to_string()))?;
    Ok(())
}

/// Receive a framed message from a QUIC stream
pub async fn receive_message(conn: &Connection) -> Result<Vec<u8>, NetworkError> {
    let mut stream = conn
        .accept_uni()
        .await
        .map_err(|e| NetworkError::ReceiveFailed(e.to_string()))?;

    // Read 4-byte length prefix
    let mut len_buf = [0u8; 4];
    stream
        .read_exact(&mut len_buf)
        .await
        .map_err(|e| NetworkError::ReceiveFailed(e.to_string()))?;
    let len = u32::from_be_bytes(len_buf) as usize;

    // Read payload
    let mut buf = vec![0u8; len];
    stream
        .read_exact(&mut buf)
        .await
        .map_err(|e| NetworkError::ReceiveFailed(e.to_string()))?;
    Ok(buf)
}

// ─── Skip cert verification for P2P mesh (nodes verify via node_id/public_key) ─

#[derive(Debug)]
struct SkipCertVerification;

impl rustls::client::danger::ServerCertVerifier for SkipCertVerification {
    fn verify_server_cert(
        &self,
        _end_entity: &CertificateDer<'_>,
        _intermediates: &[CertificateDer<'_>],
        _server_name: &rustls::pki_types::ServerName<'_>,
        _ocsp_response: &[u8],
        _now: rustls::pki_types::UnixTime,
    ) -> Result<rustls::client::danger::ServerCertVerified, rustls::Error> {
        Ok(rustls::client::danger::ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        _message: &[u8],
        _cert: &CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn verify_tls13_signature(
        &self,
        _message: &[u8],
        _cert: &CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn supported_verify_schemes(&self) -> Vec<rustls::SignatureScheme> {
        vec![
            rustls::SignatureScheme::ECDSA_NISTP256_SHA256,
            rustls::SignatureScheme::ECDSA_NISTP384_SHA384,
            rustls::SignatureScheme::RSA_PSS_SHA256,
            rustls::SignatureScheme::RSA_PSS_SHA384,
            rustls::SignatureScheme::RSA_PSS_SHA512,
            rustls::SignatureScheme::ED25519,
        ]
    }
}
