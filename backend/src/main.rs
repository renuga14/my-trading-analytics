use csv::Reader;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use std::fs::{self, File};
use warp::Filter;
use std::env;
#[derive(Debug, Deserialize)]
struct Trade {
    block_time: String,  
    token_address: String,
    price_in_sol: f64,
    amount_in_sol: f64,
    amount_in_token: f64,
}

#[derive(Serialize, Clone, Debug)]
struct TokenData {
    token: String,
    times: Vec<String>,
    prices: Vec<f64>,
    volumes_sol: Vec<f64>,
    volumes_token: Vec<f64>,
    rsi: Vec<f64>,
}

// RSI calculation
fn calculate_rsi(prices: &[f64], period: usize) -> Vec<f64> {
    let mut rsi = Vec::new();
    if prices.len() < period + 1 { return rsi; }

    for i in period..prices.len() {
        let mut gains = 0.0;
        let mut losses = 0.0;
        for j in (i - period + 1)..=i {
            let change = prices[j] - prices[j - 1];
            if change > 0.0 { gains += change; } else { losses -= change; }
        }
        let avg_gain = gains / period as f64;
        let avg_loss = losses / period as f64;
        let rs = if avg_loss == 0.0 { f64::INFINITY } else { avg_gain / avg_loss };
        let rsi_value = if rs.is_infinite() { 100.0 } else { 100.0 - (100.0 / (1.0 + rs)) };
        rsi.push(rsi_value);
    }
    rsi
}

// Function to process CSV and generate JSON
fn process_csv() -> Result<(), Box<dyn Error>> {
    let mut rdr = Reader::from_path("trades_data.csv")?;
    let mut tokens_map: HashMap<String, TokenData> = HashMap::new();

    for result in rdr.deserialize() {
        let trade: Trade = result?;
        let entry = tokens_map.entry(trade.token_address.clone())
            .or_insert(TokenData {
                token: trade.token_address.clone(),
                times: vec![],
                prices: vec![],
                volumes_sol: vec![],
                volumes_token: vec![],
                rsi: vec![],
            });

        entry.times.push(trade.block_time);
        entry.prices.push(trade.price_in_sol);
        entry.volumes_sol.push(trade.amount_in_sol);
        entry.volumes_token.push(trade.amount_in_token);
    }

    // Compute RSI for each token
    for token_data in tokens_map.values_mut() {
        token_data.rsi = calculate_rsi(&token_data.prices, 14);
    }

    //= JSON output
    let output: Vec<TokenData> = tokens_map.values().cloned().collect();
    let file = File::create("rsi_output.json")?;
    serde_json::to_writer_pretty(file, &output)?;
    println!("RSI and price data saved to rsi_output.json");

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    process_csv()?;

    // Get PORT from environment (default 8080)
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let port: u16 = port.parse().unwrap();

    let rsi_route = warp::path("rsi")
        .map(|| {
            let data = fs::read_to_string("rsi_output.json")
                .unwrap_or_else(|_| "[]".to_string());
            warp::reply::with_header(data, "Content-Type", "application/json")
        })
        .with(
            warp::cors()
                .allow_origin("http://localhost:3000")
                .allow_methods(vec!["GET"])
        );

    println!("HTTP server running at 0.0.0.0:{} /rsi", port);
    warp::serve(rsi_route).run(([0, 0, 0, 0], port)).await;

    Ok(())
}
