const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const websocket = require('socket.io');
const solana = require('@solana/web3.js');

const ssl_options = {
    key: fs.readFileSync('SSL/key.pem'),
    cert: fs.readFileSync('SSL/cert.cert')
};

const wallet = solana.Keypair.fromSecretKey(new Uint8Array([83,61,11,202,233,91,145,84,114,246,170,148,104,93,70,122,219,29,
                                                            237,128,185,176,237,178,33,164,177,85,83,48,23,17,187,58,155,176,
                                                            253,28,255,9,247,153,198,53,44,198,150,99,230,59,102,233,118,53,
                                                            198,92,189,212,78,7,148,39,179,41]));
const network = new solana.Connection(solana.clusterApiUrl('devnet'), 'confirmed');
const port = 8084;

//All Values are in lamports

const sendPayment = async function (amount, address) {
    let transaction = new solana.Transaction().add(
        solana.SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: address,
            lamports: amount
        })
    );
    const signature = await solana.sendAndConfirmTransaction(
        network,
        transaction,
        [wallet.publicKey]
    );
    return signature;
}

const verifyPayment = async function (amount, from, tx) {
    let confirmed = await network.getTransaction(tx);
    if (confirmed != null && confirmed.meta != null) {
        if (Math.abs(confirmed.meta.postBalances[0] - confirmed.meta.preBalances[0]) == amount && Math.abs(confirmed.meta.postBalances[1] - confirmed.meta.preBalances[1])) {
            return true;
        }
    }
    
}

const BlackJackTable = class {
    constructor(buyin, seats, stakes, private, password) {
        this.buyin = buyin;
        this.seats = seats;
        this.stakes = stakes;
        this.private = private;
        this.password = password;
        this.closed = false;

        this.players = [];
    }

    join(player) {
        if (this.closed)
        {
            return false;
        }
        this.players.push(player);
        if (this.players.length >= this.seats) {
            this.closed = true;
        }
        return true;
    }

    notify(message) {
        for (const player of this.players)
        {
            player.send(message);
        }
    }
};

let tables = [];
let app = express();

tables.push(new BlackJackTable(solana.LAMPORTS_PER_SOL, 8, 1, false, ""));

let server = https.createServer(options, app);
let wss = new websocket.listen(8084);


wss.on('connection', (ws) => {                  //On Client Connection (used for live updates on tables)

    let paymentVerified = false;
    let tableJoined = false;
    let tableId = null;
    let playerAddress = "";
    ws.on('join', (params) => {                 //On Join of a table (used for buy-in and live updates within the table)

        let info = JSON.parse(params);
        playerAddress = info['address'];
        if (tables[info['table']].closed) {
            ws.send(JSON.stringify({"function": "error", "reason": "Selected table is full. Please try a different table"}));
            let paymentVerified = false;
            let tableJoined = false;
            let tableId = null;
        }
        if (tables[info['table']].password != info['password']) {
            ws.send(JSON.stringify({"function": "error", "reason": "Invalid password for table! Please enter the correct password"}));
            let paymentVerified = false;
            let tableJoined = false;
            let tableId = null;
        }
        ws.send(JSON.stringify({"function": "paymentRequest", "amount": tables[info['table']].buyin, "to": wallet.publicKey}));
        tableId = info['table'];
        ws.on('bet', (params) => {              //On Betting (used to verify the bet payment and inform other users)

        });

        ws.on('move', (params) => {             //On Move (used to track player moves "hit/stand")

        });

        ws.on('response', (params) => {

        });
        
        ws.on('payment', (params) => {
            let info = JSON.parse(params);
            if (info['function'] == "buyIn") {
                if (verifyPayment()) {
                    let result = tables[tableId].join(ws);
                    if (!result) {
                        sendPayment(tables[tableId].buyin, playerAddress);
                    }
                }
            }
            else if (info['function'] == "bet") {
                if (verifyPayment()) {
                    //Set Bet
                }
            }
        });

    });

    ws.on('leave', (params) => {

    });


    ws.on('create', (params) => {
        let info = JSON.parse(params);
        ws.send(JSON.stringify({"function": "paymentRequest", "amount": info['buyin'], "to": wallet.publicKey}));
        ws.on('response', (params) => {
            //Confirm Payment
            tables.push(new BlackJackTable(info['buyin'], info['seats'], info['stakes'], info['private'], info['password']));
            tables[-1].join(ws, info['password'])
        });
    });
});

server.listen(443);
