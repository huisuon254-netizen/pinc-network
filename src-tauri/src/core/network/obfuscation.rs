use rand::{thread_rng, Rng};

pub const TLS_RECORD_HEADER: usize = 5;
pub const WEBSOCKET_MASK_SIZE: usize = 4;
pub const MIN_PADDING: usize = 32;
pub const MAX_PADDING: usize = 512;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ProtocolMimic {
    Tls12,
    WebSocket,
    Http2,
    Quic,
}

#[derive(Debug, Clone)]
pub struct ObfuscatedPacket {
    pub protocol: ProtocolMimic,
    pub data: Vec<u8>,
    pub padding: usize,
}

pub struct TrafficObfuscator {
    default_protocol: ProtocolMimic,
    sni_list: Vec<String>,
}

impl TrafficObfuscator {
    pub fn new() -> Self {
        TrafficObfuscator {
            default_protocol: ProtocolMimic::Tls12,
            sni_list: vec![
                "cloudflare.com".into(),
                "googleapis.com".into(),
                "github.com".into(),
                "microsoft.com".into(),
                "aws.amazon.com".into(),
            ],
        }
    }

    pub fn obfuscate(&self, payload: &[u8], protocol: Option<ProtocolMimic>) -> ObfuscatedPacket {
        let proto = protocol.unwrap_or(self.default_protocol);
        let mut rng = thread_rng();
        let padding = rng.gen_range(MIN_PADDING..=MAX_PADDING);
        let mut data = Vec::with_capacity(payload.len() + padding);
        match proto {
            ProtocolMimic::Tls12 => self.wrap_tls(&mut data, payload, padding),
            ProtocolMimic::WebSocket => self.wrap_websocket(&mut data, payload, padding),
            ProtocolMimic::Http2 => self.wrap_http2(&mut data, payload, padding),
            ProtocolMimic::Quic => self.wrap_quic(&mut data, payload, padding),
        }
        ObfuscatedPacket {
            protocol: proto,
            data,
            padding,
        }
    }

    pub fn deobfuscate(&self, packet: &ObfuscatedPacket) -> Vec<u8> {
        match packet.protocol {
            ProtocolMimic::Tls12 => self.unwrap_tls(&packet.data),
            ProtocolMimic::WebSocket => self.unwrap_websocket(&packet.data),
            ProtocolMimic::Http2 => self.unwrap_http2(&packet.data),
            ProtocolMimic::Quic => self.unwrap_quic(&packet.data),
        }
    }

    pub fn select_sni(&self) -> &str {
        let mut rng = thread_rng();
        let idx = rng.gen_range(0..self.sni_list.len());
        &self.sni_list[idx]
    }

    fn wrap_tls(&self, buf: &mut Vec<u8>, payload: &[u8], padding: usize) {
        let mut rng = thread_rng();
        let content_type: u8 = rng.gen_range(20..=23);
        let version: u16 = 0x0303 + rng.gen_range(0..2);
        let len = (payload.len() + padding) as u16;
        buf.push(content_type);
        buf.extend_from_slice(&version.to_be_bytes());
        buf.extend_from_slice(&len.to_be_bytes());
        buf.extend_from_slice(payload);
        let mut pad = vec![0u8; padding];
        rng.fill(pad.as_mut_slice());
        buf.extend_from_slice(&pad);
    }

    fn unwrap_tls(&self, data: &[u8]) -> Vec<u8> {
        if data.len() < TLS_RECORD_HEADER {
            return data.to_vec();
        }
        let _content_type = data[0];
        let _version = u16::from_be_bytes([data[1], data[2]]);
        let len = u16::from_be_bytes([data[3], data[4]]) as usize;
        let payload_end = TLS_RECORD_HEADER + len.min(data.len() - TLS_RECORD_HEADER);
        data[TLS_RECORD_HEADER..payload_end].to_vec()
    }

    fn wrap_websocket(&self, buf: &mut Vec<u8>, payload: &[u8], padding: usize) {
        let mut rng = thread_rng();
        let opcode: u8 = if rng.gen_bool(0.7) { 0x02 } else { 0x01 };
        let masked = 0x80;
        let len = payload.len() + padding;
        let mut header = vec![opcode | masked];
        if len < 126 {
            header.push(len as u8);
        } else if len < 65536 {
            header.push(126);
            header.extend_from_slice(&(len as u16).to_be_bytes());
        } else {
            header.push(127);
            header.extend_from_slice(&(len as u64).to_be_bytes());
        }
        let mut mask_key = [0u8; WEBSOCKET_MASK_SIZE];
        rng.fill(&mut mask_key);
        header.extend_from_slice(&mask_key);
        buf.extend_from_slice(&header);
        let mut masked_payload = payload.to_vec();
        for (i, byte) in masked_payload.iter_mut().enumerate() {
            *byte ^= mask_key[i % WEBSOCKET_MASK_SIZE];
        }
        buf.extend_from_slice(&masked_payload);
        let mut pad = vec![0u8; padding];
        rng.fill(pad.as_mut_slice());
        for (i, byte) in pad.iter_mut().enumerate() {
            *byte ^= mask_key[(payload.len() + i) % WEBSOCKET_MASK_SIZE];
        }
        buf.extend_from_slice(&pad);
    }

    fn unwrap_websocket(&self, data: &[u8]) -> Vec<u8> {
        if data.len() < 2 {
            return data.to_vec();
        }
        let _opcode = data[0] & 0x0f;
        let masked = data[0] & 0x80 != 0;
        let mut offset = 2;
        let mut len = (data[1] & 0x7f) as usize;
        if len == 126 && data.len() >= 4 {
            len = u16::from_be_bytes([data[2], data[3]]) as usize;
            offset += 2;
        } else if len == 127 && data.len() >= 10 {
            len = u64::from_be_bytes([
                data[2], data[3], data[4], data[5], data[6], data[7], data[8], data[9],
            ]) as usize;
            offset += 8;
        }
        let mut result = Vec::new();
        if masked && data.len() >= offset + WEBSOCKET_MASK_SIZE {
            let mask_key = &data[offset..offset + WEBSOCKET_MASK_SIZE];
            offset += WEBSOCKET_MASK_SIZE;
            let end = (offset + len).min(data.len());
            for (i, &byte) in data[offset..end].iter().enumerate() {
                result.push(byte ^ mask_key[i % WEBSOCKET_MASK_SIZE]);
            }
        } else {
            let end = (offset + len).min(data.len());
            result.extend_from_slice(&data[offset..end]);
        }
        result
    }

    fn wrap_http2(&self, buf: &mut Vec<u8>, payload: &[u8], padding: usize) {
        let mut rng = thread_rng();
        let len = (payload.len() + padding) as u32;
        let frame_type: u8 = rng.gen_range(0..=9);
        let flags: u8 = rng.gen();
        let stream_id: u32 = rng.gen_range(1..=0x7FFFFFFF);
        buf.extend_from_slice(&(len >> 8).to_be_bytes()[..1]);
        buf.extend_from_slice(&(len as u16).to_be_bytes());
        buf.push(frame_type);
        buf.push(flags);
        buf.extend_from_slice(&stream_id.to_be_bytes());
        buf.extend_from_slice(payload);
        let mut pad = vec![0u8; padding];
        rng.fill(pad.as_mut_slice());
        buf.extend_from_slice(&pad);
    }

    fn unwrap_http2(&self, data: &[u8]) -> Vec<u8> {
        if data.len() < 9 {
            return data.to_vec();
        }
        let len = ((data[0] as usize) << 16) | ((data[1] as usize) << 8) | (data[2] as usize);
        let _frame_type = data[3];
        let _flags = data[4];
        let _stream_id = u32::from_be_bytes([data[5], data[6], data[7], data[8]]);
        let start = 9;
        let end = (start + len).min(data.len());
        data[start..end].to_vec()
    }

    fn wrap_quic(&self, buf: &mut Vec<u8>, payload: &[u8], padding: usize) {
        let mut rng = thread_rng();
        let _flags: u8 = 0x40 | rng.gen_range(0..0x3F);
        buf.push(_flags);
        let mut dcid = [0u8; 8];
        rng.fill(&mut dcid);
        buf.extend_from_slice(&dcid);
        buf.extend_from_slice(payload);
        let mut pad = vec![0u8; padding];
        rng.fill(pad.as_mut_slice());
        buf.extend_from_slice(&pad);
    }

    fn unwrap_quic(&self, data: &[u8]) -> Vec<u8> {
        if data.is_empty() {
            return data.to_vec();
        }
        let _flags = data[0];
        if data.len() < 10 {
            return data.to_vec();
        }
        let dcid_len = match _flags & 0x0F {
            0 => 0,
            _ if _flags & 0x80 != 0 => 8,
            _ => 8,
        };
        let start = 1 + dcid_len;
        if start >= data.len() {
            return data.to_vec();
        }
        data[start..].to_vec()
    }
}

impl Default for TrafficObfuscator {
    fn default() -> Self {
        Self::new()
    }
}
