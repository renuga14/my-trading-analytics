// use futures_util::{StreamExt, SinkExt};
// // use futures_util::stream::SplitSink;
// use std::collections::HashMap;
// use tokio::time::{sleep, Duration};
// use warp::Filter;
// use serde::Serialize;
// use rand::Rng;

// #[derive(Serialize, Clone)]
// struct TradeMessage {
//     token: String,
//     price_in_sol: f64,
//     rsi: f64,
// }

// // Simple RSI calculation
// fn calculate_rsi(prices: &[f64], period: usize) -> f64 {
//     if prices.len() < period + 1 {
//         return 50.0; // neutral if not enough data
//     }
//     let mut gains = 0.0;
//     let mut losses = 0.0;
//     for i in (prices.len() - period)..(prices.len() - 1) {
//         let change = prices[i + 1] - prices[i];
//         if change > 0.0 {
//             gains += change;
//         } else {
//             losses -= change;
//         }
//     }
//     if losses == 0.0 {
//         return 100.0;
//     }
//     let rs = gains / losses;
//     100.0 - (100.0 / (1.0 + rs))
// }

// #[tokio::main]
// async fn main() {
//     let ws_route = warp::path("ws")
//         .and(warp::ws())
//         .map(|ws: warp::ws::Ws| {
//             ws.on_upgrade(|websocket| async move {
//                 // Convert warp WebSocket into a Stream + Sink
//                 let (mut tx,  _rx) = websocket.split();

//                 let tokens = vec!["TOKEN1", "TOKEN2", "TOKEN3"];
//                 let mut prices: HashMap<String, Vec<f64>> = HashMap::new();
//                 for &t in &tokens {
//                     prices.insert(t.to_string(), vec![50.0]);
//                 }

//                 loop {
//                     for &token in &tokens {
//                         let last_price = *prices.get(token).unwrap().last().unwrap();
//                         let new_price = last_price + rand::thread_rng().gen_range(-1.0..1.0);
//                         prices.get_mut(token).unwrap().push(new_price);
//                         let rsi = calculate_rsi(prices.get(token).unwrap(), 14);

//                         let msg = TradeMessage {
//                             token: token.to_string(),
//                             price_in_sol: new_price,
//                             rsi,
//                         };

//                         let json = serde_json::to_string(&msg).unwrap();

//                         // ✅ Convert to warp::ws::Message before sending
//                         if tx.send(warp::ws::Message::text(json)).await.is_err() {
//                             println!("Client disconnected.");
//                             return;
//                         }
//                     }
//                     sleep(Duration::from_secs(1)).await;
//                 }
//             })
//         });

//     println!("✅ WebSocket server running at ws://localhost:3030/ws");
//     warp::serve(ws_route).run(([127, 0, 0, 1], 3030)).await;
// }
// use csv::Reader;
// use serde::Serialize;
// use std::collections::HashMap;
// use std::error::Error;

// #[derive(Debug, Deserialize)]
// struct Trade {
//     token_address: String,
//     price_in_sol: f64,
// }

// #[derive(Serialize)]
// struct RSIData {
//     token: String,
//     rsi_values: Vec<f64>,
// }

// fn calculate_rsi(prices: &[f64], period: usize) -> Vec<f64> {
//     let mut rsi = Vec::new();
//     if prices.len() < period + 1 {
//         return rsi;
//     }

//     for i in period..prices.len() {
//         let mut gains = 0.0;
//         let mut losses = 0.0;

//         for j in (i - period + 1)..=i {
//             let change = prices[j] - prices[j - 1];
//             if change > 0.0 {
//                 gains += change;
//             } else {
//                 losses -= change; // losses are positive
//             }
//         }

//         let avg_gain = gains / period as f64;
//         let avg_loss = losses / period as f64;

//         let rs = if avg_loss == 0.0 {
//             100.0
//         } else {
//             avg_gain / avg_loss
//         };

//         let rsi_value = 100.0 - (100.0 / (1.0 + rs));
//         rsi.push(rsi_value);
//     }

//     rsi
// }

// fn main() -> Result<(), Box<dyn Error>> {
//     let mut rdr = Reader::from_path("trades_data.csv")?;
//     let mut token_prices: HashMap<String, Vec<f64>> = HashMap::new();

//     for result in rdr.deserialize() {
//         let record: Trade = result?;
//         token_prices
//             .entry(record.token_address.clone())
//             .or_default()
//             .push(record.price_in_sol);
//     }

//     let mut output: Vec<RSIData> = Vec::new();
//     for (token, prices) in token_prices.iter() {
//         let rsi_values = calculate_rsi(prices, 14);
//         output.push(RSIData {
//             token: token.clone(),
//             rsi_values,
//         });
//     }

//     // Write output to JSON for frontend
//     serde_json::to_writer_pretty(std::fs::File::create("rsi_output.json")?, &output)?;
//     println!("RSI calculation done. Output saved to rsi_output.json");

//     Ok(())
// }
use csv::Reader;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use std::fs::{self, File};
use warp::Filter;

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

    // Write JSON output
    let output: Vec<TokenData> = tokens_map.values().cloned().collect();
    let file = File::create("rsi_output.json")?;
    serde_json::to_writer_pretty(file, &output)?;
    println!("✅ RSI and price data saved to rsi_output.json");

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Step 1: Process CSV and generate JSON
    process_csv()?;

    // Step 2: Start HTTP server
    let rsi_route = warp::path("rsi")
        .map(|| {
            let data = fs::read_to_string("rsi_output.json")
                .unwrap_or_else(|_| "[]".to_string());
            warp::reply::with_header(data, "Content-Type", "application/json")
        })
         .with(
        warp::cors()
            .allow_origin("http://localhost:3000") // your Next.js frontend
            .allow_methods(vec!["GET"])
    );

    println!("HTTP server running at http://localhost:3030/rsi");
    warp::serve(rsi_route).run(([127, 0, 0, 1], 3030)).await;

    Ok(())
}
