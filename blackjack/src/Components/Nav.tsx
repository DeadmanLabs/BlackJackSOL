import { 
    WalletDisconnectButton,
    WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError, WalletSignTransactionError } from '@solana/wallet-adapter-base';
import React, { useState, useCallback, useEffect } from 'react';
import './Styles/Nav.css';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

function Nav(props: any)
{
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    let refreshBalance = async function() {
        if (!publicKey) 
        {
            return (0.0).toFixed(8);
        }
        try
        {
            const balance = (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL;
            return balance.toFixed(8);
        }
        catch (e) 
        {
            alert("Failed to grab balance!" + (e as Error).message);
        }
    }

    return (
        <div className="nav">
            <li className="nav-left"><a>Left Element</a></li>
            <li className="nav-middle"><a>
                <div className="balance-view" onClick={refreshBalance}> SOL</div>
            </a></li>
            <li className="nav-right"><a><WalletMultiButton /></a></li>
            <li className="nav-right"><a><WalletDisconnectButton /></a></li>
        </div>
    )
}

export { Nav };