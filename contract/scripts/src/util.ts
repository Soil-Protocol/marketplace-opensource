import {MsgStoreCode, LCDClient, MnemonicKey, MsgInstantiateContract, Coins, MsgExecuteContract, Wallet, MsgSend, Coin, MsgMigrateContract} from '@terra-money/terra.js'
import * as fs from 'fs'

require('dotenv').config()

const DELAY_TIME = 1000 // this to prevent unauthorization error
const GAS_LIMIT = 10000000

const {NETWORK} = process.env

const networks = {
    localterra: {
        URL: 'http://localhost:1317',
        chainID: 'localterra',
        gasAdjustment: 1.5
    },
    testnet: {
        URL: 'https://pisco-lcd.terra.dev',
        chainID: 'pisco-1',
        gasAdjustment: 1.5
    },
    mainnet: {
        URL: 'https://phoenix-lcd.terra.dev',
        chainID: 'phoenix-1',
        gasAdjustment: 1.5
    }
}

const terra = new LCDClient(networks['testnet'])

export const instantiate = async (network) => {
    return new LCDClient(networks[network])
}

export const create_wallet = (mnemonic) => {
    const key = new MnemonicKey({
        mnemonic
    })
    return terra.wallet(key)
}

export const upload = async (
    wallet,
    path,
    fee='5000000uusd'
):Promise<Number> => { 
    const tx = await wallet.createAndSignTx({
        msgs: [
            new MsgStoreCode(
                wallet.key.accAddress,
                fs.readFileSync(path, { encoding: 'base64'})
            )
        ]
    })
    try {
        const response = await terra.tx.broadcast(tx);
        const logs = JSON.parse(response.raw_log)
        let code_id = ''
        logs.forEach( (log) => {
            log.events.forEach( (event) => {
                if(event.type == 'store_code') {
                    code_id = event.attributes.find( (attribute) => attribute.key == 'code_id').value
                }
            })
        })
        await delay(DELAY_TIME)
        return Number(code_id)
    } catch (err) {
        console.log('err ', err)
        throw err
    }
}

export const init = async (
    wallet,
    code_id,
    init_msg,
    label
) => {
    const msg = new MsgInstantiateContract(wallet.key.accAddress, wallet.key.accAddress, code_id, init_msg, [], label)
    const tx = await wallet.createAndSignTx({
      msgs: [
        msg
      ]
    });
    try {
        const response = await terra.tx.broadcast(tx);
        await delay(DELAY_TIME)
        const logs = JSON.parse(response.raw_log)
        let contract_addr = ''
        logs.forEach( (log) => {
            log.events.forEach( (event) => {
                if(event.type == 'instantiate') {
                    contract_addr = event.attributes.find( (attribute) => attribute.key == '_contract_address').value
                }
            })
        })
        await delay(DELAY_TIME)
        return {
            contract_addr: contract_addr,
            logs
        }
    } catch (err) {
        console.log('err ', err)
        throw err
    }
};

export const execute = async (
    wallet:Wallet,
    addr,
    execute_msg,
    coins?,
    fee='3800000uusd'
) => {
    let coin = new Coins()
    if(coins)
        coin = Coins.fromString(coins)
    const msgs = [new MsgExecuteContract(wallet.key.accAddress, addr, execute_msg, coin)]
    //const _fee = await terra.tx.estimateFee(wallet.key.accAddress, msgs, { feeDenoms: ['uluna']})
    const tx = await wallet.createAndSignTx({
      msgs: msgs
    });
    const response = await terra.tx.broadcast(tx);
    await delay(DELAY_TIME)
    return response;
}

export const batchExecuteRaw = async (
    wallet:Wallet,
    msgs: MsgExecuteContract[],
) => {
    //const _fee = await terra.tx.estimateFee(wallet.key.accAddress, msgs, { feeDenoms: ['uluna']})
    const tx = await wallet.createAndSignTx({
      msgs
    });
    const response = await terra.tx.broadcast(tx);
    await delay(DELAY_TIME)
    return response;
}

export const batchExecute = async (
    wallet:Wallet,
    addr,
    execute_msgs,
    coins?,
    fee='3800000uusd'
) => {
    let coin = new Coins()
    if(coins)
        coin = Coins.fromString(coins)
    const msgs = execute_msgs.map(execute_msg => {
        return new MsgExecuteContract(wallet.key.accAddress, addr, execute_msg, coin)
    })
    //const _fee = await terra.tx.estimateFee(wallet.key.accAddress, msgs, { feeDenoms: ['uluna']})
    const tx = await wallet.createAndSignTx({
      msgs: msgs
    });
    const response = await terra.tx.broadcast(tx);
    await delay(DELAY_TIME)
    return response;
}

export const migrate = async (
    wallet,
    addr,
    code_id,
    migrate_msg,
    fee='5000000uusd'
) => {
    const tx = await wallet.createAndSignTx({
        msgs: [new MsgMigrateContract(wallet.key.accAddress, addr, code_id, migrate_msg)]
    });
    try {
        const response = await terra.tx.broadcast(tx)
        await delay(DELAY_TIME)
        return response
    } catch (err) {
        throw err
    }
}

export const transfer = async (wallet:Wallet, addr, coins, fee='2500000uusd') => {
    
    const tx = await wallet.createAndSignTx({
        msgs: [new MsgSend(
            wallet.key.accAddress,
            addr,
            Coins.fromString(coins)
        )]
    })
    const response = await terra.tx.broadcast(tx)
    await delay(DELAY_TIME)
    return response;
}

export const balance = async (addr) => {
    return await terra.bank.balance(addr)
}

export const query = async (addr, msg) => {
    const response = await terra.wasm.contractQuery(addr,msg)
    return response
}

export const codeInfo = async (codeId:number) => {
    const response = await terra.wasm.codeInfo(codeId)
    return response
}

export const contractInfo = async (addr: string) => {
    const response = await terra.wasm.contractInfo(addr)
    return response
}

export const delay = (ms) => {
    return new Promise( resolve => setTimeout(resolve, ms, {}) )
}