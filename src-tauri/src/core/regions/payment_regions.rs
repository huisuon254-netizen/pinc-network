use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::core::regions::COUNTRIES;

/// A local payment method available in a region.
/// No API keys required — the agent prompts the user for their local payment details.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub name: String,
    pub display_name: String,
    pub method_type: String,
    pub supported_countries: Vec<String>,
    pub prompt_message: String,
    pub input_fields: Vec<PaymentField>,
    pub currencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentField {
    pub key: String,
    pub label: String,
    pub field_type: String,
    pub required: bool,
    pub placeholder: String,
}

fn strs<S: ToString, I: IntoIterator<Item = S>>(i: I) -> Vec<String> {
    i.into_iter().map(|s| s.to_string()).collect()
}

fn all_country_iso2s() -> Vec<String> {
    COUNTRIES.iter().map(|c| c.iso2.to_string()).collect()
}

pub fn payment_methods() -> Vec<PaymentMethod> {
    vec![
        PaymentMethod {
            name: "mpesa".to_string(),
            display_name: "M-Pesa".to_string(),
            method_type: "mobile_money".to_string(),
            supported_countries: strs([
                "KE", "TZ", "UG", "RW", "CD", "MZ", "LS", "SZ", "ET", "SO", "DJ", "ER", "BI", "GH",
                "NG", "ZM", "MW",
            ]),
            prompt_message: "Enter your M-Pesa phone number to receive payment.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "phone".to_string(),
                    label: "Phone Number".to_string(),
                    field_type: "tel".to_string(),
                    required: true,
                    placeholder: "+2547XXXXXXXX".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs([
                "KES", "TZS", "UGX", "RWF", "CDF", "MZN", "LSL", "SZL", "ETB", "SOS", "DJF", "ERN",
                "BIF", "GHS", "NGN", "ZMW", "MWK",
            ]),
        },
        PaymentMethod {
            name: "airtel_money".to_string(),
            display_name: "Airtel Money".to_string(),
            method_type: "mobile_money".to_string(),
            supported_countries: strs([
                "KE", "TZ", "UG", "RW", "CD", "MW", "ZM", "NG", "GH", "CI", "SN", "ML", "BF", "NE",
                "TD", "CF", "CG", "GA", "GQ", "ST", "BJ", "GM", "GN", "GW", "SL", "MG", "MR",
            ]),
            prompt_message: "Enter your Airtel Money phone number to receive payment.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "phone".to_string(),
                    label: "Phone Number".to_string(),
                    field_type: "tel".to_string(),
                    required: true,
                    placeholder: "+2547XXXXXXXX".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs([
                "KES", "TZS", "UGX", "RWF", "MWK", "ZMW", "NGN", "GHS", "XOF", "XAF",
            ]),
        },
        PaymentMethod {
            name: "orange_money".to_string(),
            display_name: "Orange Money".to_string(),
            method_type: "mobile_money".to_string(),
            supported_countries: strs([
                "CI", "SN", "ML", "BF", "NE", "TD", "CF", "CG", "GA", "GQ", "ST", "MG", "MR", "LR",
                "SL", "GN", "GW", "GM", "BJ", "MW", "LS", "SZ",
            ]),
            prompt_message: "Enter your Orange Money phone number.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "phone".to_string(),
                    label: "Phone Number".to_string(),
                    field_type: "tel".to_string(),
                    required: true,
                    placeholder: "+225XXXXXXXXX".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs(["XOF", "XAF", "MGA", "MRU", "LRD", "SLL", "GNF", "GMD"]),
        },
        PaymentMethod {
            name: "mtn_money".to_string(),
            display_name: "MTN Mobile Money".to_string(),
            method_type: "mobile_money".to_string(),
            supported_countries: strs([
                "GH", "UG", "RW", "CD", "ZM", "MW", "NG", "CI", "SN", "ML", "BF", "NE", "LR", "SL",
                "GN", "GM", "BJ", "TG",
            ]),
            prompt_message: "Enter your MTN Mobile Money phone number.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "phone".to_string(),
                    label: "Phone Number".to_string(),
                    field_type: "tel".to_string(),
                    required: true,
                    placeholder: "+233XXXXXXXXX".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs([
                "GHS", "UGX", "RWF", "CDF", "ZMW", "MWK", "NGN", "XOF", "XAF",
            ]),
        },
        PaymentMethod {
            name: "bank_transfer".to_string(),
            display_name: "Bank Transfer".to_string(),
            method_type: "bank".to_string(),
            supported_countries: all_country_iso2s(),
            prompt_message: "Enter the bank account details to receive the transfer.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "account_name".to_string(),
                    label: "Account Name".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "Full name on account".to_string(),
                },
                PaymentField {
                    key: "account_number".to_string(),
                    label: "Account Number".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "XXXXXXXXXX".to_string(),
                },
                PaymentField {
                    key: "bank_name".to_string(),
                    label: "Bank Name".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "e.g. Equity Bank".to_string(),
                },
                PaymentField {
                    key: "swift_code".to_string(),
                    label: "SWIFT/BIC (international)".to_string(),
                    field_type: "text".to_string(),
                    required: false,
                    placeholder: "BOFAUS3N".to_string(),
                },
                PaymentField {
                    key: "iban".to_string(),
                    label: "IBAN (EUR countries)".to_string(),
                    field_type: "text".to_string(),
                    required: false,
                    placeholder: "GB33BUKB20201555555555".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: all_country_iso2s(),
        },
        PaymentMethod {
            name: "skrill".to_string(),
            display_name: "Skrill".to_string(),
            method_type: "e_wallet".to_string(),
            supported_countries: strs([
                "GB", "DE", "FR", "ES", "IT", "PT", "NL", "BE", "LU", "AT", "CH", "SE", "DK", "NO",
                "FI", "IE", "IS", "EE", "LV", "LT", "PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI",
                "GR", "CY", "MT", "US", "CA", "AU", "NZ", "ZA", "NG", "KE", "MY", "SG", "TH", "PH",
                "ID", "VN", "MX", "BR", "AR", "CO", "CL", "PE", "TR", "AE", "SA", "QA", "KW", "BH",
                "OM", "RU", "UA", "JP", "KR", "IN", "PK", "BD", "HK", "TW", "KZ", "UZ", "AZ", "GE",
                "AM", "BY", "MD", "BO",
            ]),
            prompt_message: "Enter your Skrill email address to receive payment.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "email".to_string(),
                    label: "Skrill Email".to_string(),
                    field_type: "email".to_string(),
                    required: true,
                    placeholder: "user@example.com".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs([
                "USD", "EUR", "GBP", "CHF", "PLN", "CZK", "SEK", "NOK", "DKK", "HUF", "RON", "BGN",
                "AED", "SAR", "TRY",
            ]),
        },
        PaymentMethod {
            name: "stripe".to_string(),
            display_name: "Stripe".to_string(),
            method_type: "card_processor".to_string(),
            supported_countries: strs([
                "US", "CA", "GB", "IE", "AU", "NZ", "SG", "HK", "MY", "TH", "PH", "ID", "VN", "DE",
                "FR", "ES", "IT", "PT", "NL", "BE", "LU", "AT", "CH", "SE", "DK", "NO", "FI", "MX",
                "BR", "AR", "CO", "CL", "PE", "CR", "PA", "ZA", "NG", "GH", "KE", "EG", "MA", "TN",
                "AE", "SA", "QA", "KW", "BH", "OM", "JO", "LB", "IN", "JP", "KR", "TW", "TR", "PL",
                "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "EE", "LV", "LT", "GR", "CY", "MT", "BO",
                "KZ", "UZ", "AZ", "GE", "AM", "MD",
            ]),
            prompt_message: "Enter card details for payment via Stripe.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "card_number".to_string(),
                    label: "Card Number".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "4242 4242 4242 4242".to_string(),
                },
                PaymentField {
                    key: "expiry".to_string(),
                    label: "Expiry (MM/YY)".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "MM/YY".to_string(),
                },
                PaymentField {
                    key: "cvc".to_string(),
                    label: "CVC".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "123".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs([
                "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "SGD", "HKD", "JPY", "KRW", "INR", "BRL",
                "MXN", "ZAR", "AED", "SAR", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK",
            ]),
        },
        PaymentMethod {
            name: "paypal".to_string(),
            display_name: "PayPal".to_string(),
            method_type: "e_wallet".to_string(),
            supported_countries: strs([
                "US", "CA", "GB", "IE", "AU", "NZ", "SG", "HK", "MY", "TH", "PH", "ID", "VN", "DE",
                "FR", "ES", "IT", "PT", "NL", "BE", "LU", "AT", "CH", "SE", "DK", "NO", "FI", "IS",
                "MX", "BR", "AR", "CO", "CL", "PE", "ZA", "KE", "NG", "GH", "EG", "MA", "TN", "IL",
                "AE", "SA", "QA", "KW", "BH", "OM", "JO", "LB", "TR", "IN", "JP", "KR", "TW", "RU",
                "UA", "KZ", "UZ", "AZ", "GE", "AM", "MD", "BO",
            ]),
            prompt_message: "Enter your PayPal email to receive payment.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "email".to_string(),
                    label: "PayPal Email".to_string(),
                    field_type: "email".to_string(),
                    required: true,
                    placeholder: "user@example.com".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs([
                "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN", "BRL", "CHF", "SEK", "NOK", "DKK",
                "PLN", "CZK", "HUF", "RUB", "ILS", "TRY", "AED", "SAR", "MYR", "PHP", "THB", "VND",
                "SGD", "HKD", "TWD", "KRW", "INR", "NGN", "KES", "ZAR",
            ]),
        },
        PaymentMethod {
            name: "usdt".to_string(),
            display_name: "USDT (Crypto)".to_string(),
            method_type: "crypto".to_string(),
            supported_countries: all_country_iso2s(),
            prompt_message: "Enter your USDT wallet address to receive payment.".to_string(),
            input_fields: vec![
                PaymentField {
                    key: "wallet_address".to_string(),
                    label: "USDT Wallet Address".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "0x... or T...".to_string(),
                },
                PaymentField {
                    key: "network".to_string(),
                    label: "Network (TRC20/ERC20/BEP20)".to_string(),
                    field_type: "text".to_string(),
                    required: true,
                    placeholder: "TRC20".to_string(),
                },
                PaymentField {
                    key: "amount".to_string(),
                    label: "Amount (USDT)".to_string(),
                    field_type: "number".to_string(),
                    required: true,
                    placeholder: "0.00".to_string(),
                },
            ],
            currencies: strs(["USDT"]),
        },
    ]
}

use std::sync::OnceLock;

static METHODS_CELL: OnceLock<Vec<PaymentMethod>> = OnceLock::new();

pub fn get_payment_methods() -> &'static [PaymentMethod] {
    METHODS_CELL.get_or_init(payment_methods)
}

pub fn get_payment_method(name: &str) -> Option<&'static PaymentMethod> {
    get_payment_methods().iter().find(|m| m.name == name)
}

pub fn list_payment_methods_for_country(iso2: &str) -> Vec<&'static PaymentMethod> {
    let needle = iso2.trim().to_uppercase();
    get_payment_methods()
        .iter()
        .filter(|m| m.supported_countries.contains(&needle))
        .collect()
}

pub fn agent_prompt_for_payment(iso2: &str, amount: f64) -> serde_json::Value {
    let methods = list_payment_methods_for_country(iso2);
    let suggestions: Vec<serde_json::Value> = methods
        .iter()
        .map(|m| {
            serde_json::json!({
                "method": m.name,
                "display": m.display_name,
                "type": m.method_type,
                "prompt": m.prompt_message,
                "fields": m.input_fields,
                "currencies": m.currencies,
                "amount": amount,
            })
        })
        .collect();
    serde_json::json!({
        "country": iso2,
        "available_methods": suggestions,
        "agent_message": format!("Payment of {:.2} requested. Please choose a payment method available in your region.", amount),
    })
}

// ─── EXCHANGE RATES ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeRate {
    pub pair: String,
    pub base: String,
    pub quote: String,
    pub rate: f64,
    pub timestamp: i64,
    pub source: String,
}

#[derive(Debug, Clone)]
pub struct ExchangeRateEngine {
    cache: Arc<Mutex<HashMap<String, ExchangeRate>>>,
}

impl Default for ExchangeRateEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl ExchangeRateEngine {
    pub fn new() -> Self {
        ExchangeRateEngine {
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn seed_static_rates(&self) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let static_rates: &[(&str, f64)] = &[
            ("USD/USD", 1.0),
            ("EUR/USD", 1.08),
            ("GBP/USD", 1.26),
            ("JPY/USD", 0.0067),
            ("CNY/USD", 0.138),
            ("INR/USD", 0.012),
            ("NGN/USD", 0.00105),
            ("KES/USD", 0.007),
            ("BRL/USD", 0.195),
            ("MXN/USD", 0.058),
            ("ARS/USD", 0.0011),
            ("TRY/USD", 0.030),
            ("AED/USD", 0.272),
            ("SAR/USD", 0.266),
            ("RUB/USD", 0.011),
            ("UAH/USD", 0.025),
            ("USDT/USD", 1.0),
            ("USDC/USD", 1.0),
            ("BTC/USD", 67000.0),
            ("ETH/USD", 3500.0),
            ("SOL/USD", 145.0),
            ("TZS/USD", 0.00024),
            ("UGX/USD", 0.00026),
            ("GHS/USD", 0.083),
            ("ZAR/USD", 0.055),
            ("EGP/USD", 0.021),
            ("MAD/USD", 0.096),
            ("TND/USD", 0.032),
            ("DZD/USD", 0.0074),
            ("PKR/USD", 0.0036),
            ("BDT/USD", 0.0093),
            ("IDR/USD", 0.000062),
            ("MYR/USD", 0.212),
            ("THB/USD", 0.027),
            ("VND/USD", 0.000041),
            ("PHP/USD", 0.017),
            ("SGD/USD", 0.735),
            ("HKD/USD", 0.128),
            ("TWD/USD", 0.030),
            ("KRW/USD", 0.00072),
            ("AUD/USD", 0.65),
            ("NZD/USD", 0.59),
            ("CAD/USD", 0.73),
            ("CHF/USD", 1.11),
            ("SEK/USD", 0.095),
            ("DKK/USD", 0.145),
            ("NOK/USD", 0.094),
            ("PLN/USD", 0.25),
            ("CZK/USD", 0.044),
            ("HUF/USD", 0.0028),
            ("RON/USD", 0.214),
            ("BGN/USD", 0.552),
            ("HRK/USD", 0.132),
            ("RSD/USD", 0.0087),
            ("MKD/USD", 0.018),
            ("GEL/USD", 0.37),
            ("AMD/USD", 0.0025),
            ("AZN/USD", 0.588),
            ("KZT/USD", 0.0021),
            ("UZS/USD", 0.000083),
            ("KGS/USD", 0.011),
            ("TJS/USD", 0.088),
            ("TMT/USD", 0.286),
            ("BYN/USD", 0.303),
            ("MDL/USD", 0.056),
            ("XOF/USD", 0.0016),
            ("XAF/USD", 0.0016),
            ("GMD/USD", 0.014),
            ("GNF/USD", 0.00012),
            ("SLE/USD", 0.044),
            ("SOS/USD", 0.00175),
            ("STN/USD", 0.043),
            ("SZL/USD", 0.055),
            ("DJF/USD", 0.0056),
            ("ERN/USD", 0.066),
            ("LSL/USD", 0.055),
            ("MGA/USD", 0.00022),
            ("MRU/USD", 0.025),
            ("MWK/USD", 0.00058),
            ("BOB/USD", 0.144),
        ];
        if let Ok(mut cache) = self.cache.lock() {
            for (pair, rate) in static_rates {
                let parts: Vec<&str> = pair.split('/').collect();
                cache.insert(
                    pair.to_string(),
                    ExchangeRate {
                        pair: pair.to_string(),
                        base: parts[0].to_string(),
                        quote: parts[1].to_string(),
                        rate: *rate,
                        timestamp: now,
                        source: "static_seed".to_string(),
                    },
                );
            }
        }
    }

    pub fn get_rate(&self, pair: &str) -> Option<ExchangeRate> {
        let cache = self.cache.lock().ok()?;
        cache.get(pair).cloned()
    }

    pub fn convert(&self, amount: f64, from: &str, to: &str) -> Option<f64> {
        if from == to {
            return Some(amount);
        }
        let direct_pair = format!("{}/{}", from, to);
        if let Some(r) = self.get_rate(&direct_pair) {
            return Some(amount * r.rate);
        }
        let inverse_pair = format!("{}/{}", to, from);
        if let Some(r) = self.get_rate(&inverse_pair) {
            return Some(amount / r.rate);
        }
        let from_usd = format!("{}/USD", from);
        let to_usd = format!("{}/USD", to);
        if let (Some(f), Some(t)) = (self.get_rate(&from_usd), self.get_rate(&to_usd)) {
            return Some((amount * f.rate) / t.rate);
        }
        None
    }

    pub fn set_rate(&self, pair: &str, rate: f64, source: &str) {
        let parts: Vec<&str> = pair.split('/').collect();
        if parts.len() != 2 {
            return;
        }
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        if let Ok(mut cache) = self.cache.lock() {
            cache.insert(
                pair.to_string(),
                ExchangeRate {
                    pair: pair.to_string(),
                    base: parts[0].to_string(),
                    quote: parts[1].to_string(),
                    rate,
                    timestamp: now,
                    source: source.to_string(),
                },
            );
        }
    }

    pub fn all_rates(&self) -> Vec<ExchangeRate> {
        let Ok(cache) = self.cache.lock() else {
            return Vec::new();
        };
        cache.values().cloned().collect()
    }
}
