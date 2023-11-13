// components/CreateMerkleTree.js

import React, { useState } from 'react';
import { WalletContextState } from '@solana/wallet-adapter-react'
import { SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, SPL_NOOP_PROGRAM_ID, ValidDepthSizePair, createAllocTreeIx } from '@solana/spl-account-compression'
import { Keypair, Connection, Transaction, PublicKey } from '@solana/web3.js';
import { createCreateTreeInstruction, PROGRAM_ADDRESS as MPL_BUBBLEGUM_PROGRAM_ID, createMintToCollectionV1Instruction } from '@metaplex-foundation/mpl-bubblegum'

interface CreateMerkleTreeProps {
  wallet: WalletContextState
}

const CreateMerkleTree = (props: CreateMerkleTreeProps) => {
  const [treeSize, setTreeSize] = useState('medium'); // default size

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    // Logic to create a Merkle Tree with the selected size
    
    
    // Implement the creation of the Merkle Tree here

    if (!props.wallet.connected) return
    if (!props.wallet.publicKey) return
    if (props.wallet.signMessage == undefined) return
    if (props.wallet.signTransaction == undefined) return

    console.log('Creating Merkle Tree of size:', treeSize);
    console.log(`We have wallet ${props.wallet.publicKey?.toBase58()}`)
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC!)

    let tx = new Transaction()

    const maxDepthSizePair: ValidDepthSizePair = {
      // max=16,384 nodes (for a `maxDepth` of 14)
      maxDepth: 14,
      maxBufferSize: 64,
    };

    // define the canopy depth of our tree to be created
    const canopyDepth = 10;

    // Generate a place for the tree to live
    const treeKeypair = Keypair.generate();

    // derive the tree's authority (PDA), owned by Bubblegum
    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
      [treeKeypair.publicKey.toBuffer()],
      new PublicKey(MPL_BUBBLEGUM_PROGRAM_ID),
    );

    const allocTreeIx = await createAllocTreeIx(
      connection,
      treeKeypair.publicKey,
      props.wallet.publicKey,
      maxDepthSizePair,
      canopyDepth,
    );

    // create the instruction to actually create the tree
    const createTreeIx = createCreateTreeInstruction(
      {
        payer: props.wallet.publicKey,
        treeCreator: props.wallet.publicKey,
        treeAuthority,
        merkleTree: treeKeypair.publicKey,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        logWrapper: SPL_NOOP_PROGRAM_ID,
      },
      {
        maxBufferSize: maxDepthSizePair.maxBufferSize,
        maxDepth: maxDepthSizePair.maxDepth,
        public: false,
      },
      new PublicKey(MPL_BUBBLEGUM_PROGRAM_ID),
    );

    tx.add(allocTreeIx)
    tx.add(createTreeIx)

    let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    tx.recentBlockhash = blockhash
    tx.feePayer = props.wallet.publicKey
    

    tx.partialSign(treeKeypair)
    console.log(tx)
    try {
    await props.wallet.signTransaction(tx)
    }catch(e:any){
      console.log(e)
    }
    // const res = await connection.sendRawTransaction(tx.serialize())
    // let res = await sendRawTX(tx.serialize(), web3, connection, true)
    // console.log("res", res)

  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white shadow-md rounded-md">
      <h1 className="text-xl font-semibold mb-4">Create Merkle Tree</h1>
      <form onSubmit={handleSubmit}>
        {['extraSmall', 'small', 'medium', 'large', 'extraLarge'].map((size) => (
          <label key={size} className="inline-flex items-center mt-3">
            <input
              type="radio"
              className="form-radio h-5 w-5 text-blue-600"
              value={size}
              checked={treeSize === size}
              onChange={(e) => setTreeSize(e.target.value)}
            />
            <span className="ml-2 text-gray-700 capitalize">{size}</span>
          </label>
        ))}
        <button
          type="submit"
          className="mt-6 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateMerkleTree;
