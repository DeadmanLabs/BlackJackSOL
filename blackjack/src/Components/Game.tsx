import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError, WalletSignTransactionError } from '@solana/wallet-adapter-base';
import React, { useState, useCallback, useEffect } from 'react';
import './Styles/Game.tsx';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import socketIOClient from "socket.io-client";

function Game(props)
{
    const [response, setResponse] = useState("");

    useEffect(() => {
        const socket = socketIOClient(props.endpoint);
        socket.on("table_init", (data) => function (data) {
            setResponse("");
        });

        //return () => socket.disconnect();
    }, []);

    return (
        <div className="game">

        </div>
    );
}

export { Game };