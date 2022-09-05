import React, { useState, useEffect } from 'react';
import "../assets/styles.css";
import image1 from "../assets/img/mint-punk.png";
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useSelector } from "react-redux";
import { ethers } from "ethers";
import axios from "axios"
import { Table } from "react-bootstrap";
import { CircularProgress } from "@mui/material"
import nftContract from "../artifacts/Punk.sol/Punk.json";
import { nftContractAddress, networkDeployedTo } from "../utils/contracts-config";
import networksMap from "../utils/networksMap.json";
import { getAddress } from 'ethers/lib/utils';

function MintPage() {
    const data = useSelector((state) => state.blockchain.value)

    const [mintAmount, setMintAmount] = useState(1)
    const [userNfts, setUserNfts] = useState([])
    const [info, setInfo] = useState({
        currentSupply: 0,
        maxSupply: 0,
        maxMintAmountPerTx: 5,
        mintCost: 0,
        paused: 1
    })
    const [loading, setLoading] = useState(false)

    const getInfo = async () => {
        if (data.network === networksMap[networkDeployedTo]) {
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            const nft_contract = new ethers.Contract(nftContractAddress, nftContract.abi, provider);
            const signer = provider.getSigner()
            const user = await signer.getAddress()
            const paused = await nft_contract.paused()
            var userTokens = Array.from((await nft_contract.balanceOf(user)), x => Number(x))
            const maxMintAmountPerTx = await nft_contract.maxMintAmountPerTx()
            const cost = await nft_contract.cost()
            const baseURI = await nft_contract.uriPrefix()
            const baseExtension = await nft_contract.uriSuffix()
            const totalSupply = await nft_contract.totalSupply()
            const maxSupply = await nft_contract.maxSupply()
                

            setInfo({
                currentSupply: Number(totalSupply),
                maxSupply: Number(maxSupply),
                maxMintAmountPerTx: Number(maxMintAmountPerTx),
                mintCost: Number(ethers.utils.formatUnits(cost, "ether")),
                paused: Number(paused),
                userNftIds: userTokens,
            })

            const _userNfts = await Promise.all(userTokens.map(async (nft) => {
                const metadata = await axios.get(
                    baseURI.replace("ipfs://", "https://ipfs.io/ipfs/") + "/" + nft.toString() + baseExtension
                )
                return {
                    id: nft,
                    uri: metadata.data.image.replace("ipfs://", "https://ipfs.io/ipfs/")
                }
            }))

            setUserNfts(_userNfts)
        }
    }
    
    const mint = async () => {
        if (data.network === networksMap[networkDeployedTo] && info.paused === 1) {
            try {
                setLoading(true)  
                const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
                const signer = provider.getSigner()
                const nft_contract = new ethers.Contract(nftContractAddress, nftContract.abi, signer);
                let userAddress = await signer.getAddress()
                const priceWei = parseInt(await nft_contract.cost());
                const walletMint = parseInt(await nft_contract.WalletMint(userAddress));
                const free = parseInt(await nft_contract.freeMint());
                console.log(mintAmount);
                if (walletMint < free) {
                    console.log("free"+free);
                    const totalMintCost = ethers.BigNumber.from(priceWei).mul(mintAmount-free);
                    console.log("Cost"+totalMintCost);
                    const gasLimit = await nft_contract.estimateGas.publicSaleMint(mintAmount, {value:totalMintCost});
                    const newGasLimit = parseInt((gasLimit *1.2)).toString();
                    const mint_tx = await nft_contract.publicSaleMint(mintAmount, {value:totalMintCost,gasLimit : newGasLimit})
                    await mint_tx.wait()
                } else {
                    const totalMintCost = ethers.BigNumber.from(priceWei).mul(mintAmount);
                    const gasLimit = await nft_contract.estimateGas.publicSaleMint(mintAmount, {value:totalMintCost});
                    const newGasLimit = parseInt((gasLimit *1.2)).toString();
                    const mint_tx = await nft_contract.publicSaleMint(mintAmount, {value:totalMintCost,gasLimit : newGasLimit})
                    await mint_tx.wait()
                }
                setLoading(false)
                getInfo()
            } catch (error) {
                setLoading(false)
                window.alert("An error has occured, Please Try Again")
                console.log(error)
            }
        }
    }
    useEffect(() => {
        getInfo()
    }, [data.account])

    return (
        <section>
            <NavBar />
            <br />
            <section className="claim" id="claim">
                <div className="roadmap-container"  >
                    <div className='info-container'>
                        <h3 className='text-center p-2'>Minting Info</h3>
                        <Table responsive>
                            <tbody>
                                <tr>
                                    <td className='p-2'>Total Collection Supply</td>
                                    <td>{info.maxSupply}</td>
                                </tr>
                                <tr>
                                    <td className='p-2'>Minted NFT Count</td>
                                    <td>{info.currentSupply}</td>
                                </tr>
                                <tr>
                                    <td className='p-2'>Mint Cost</td>
                                    <td>{info.mintCost} ETH</td>
                                </tr>
                                <tr>
                                    <td className='p-2'>Max Mint Amount Per TX </td>
                                    <td>{info.maxMintAmountPerTx} </td>
                                </tr>
                            </tbody>
                        </Table >
                    </div>
                </div>
                <div className="roadmap-container" >
                    <div className='mint-container'>
                        <div className="row" style={{ justifyContent: "center" }}>
                            <div className="col-md-7">
                                <div className="text-center">
                                    <h2 className="minttitle title">
                                        Claim Your Punk
                                    </h2>
                                    <img src={image1} className="mint-img" alt="" />
                                    <p className="lead" style={{ marginBottom: "30px" }}>A Punk is a character that is part of an 10000 algorithmically generated collection consisting of extremely unique features ranging from faces, eyes, mouths, skins, hats, and backgrounds.</p>
                                    <div className="form-group" >
                                        <div className="d-flex justify-content-center">
                                            <button type="button"
                                                className="minus btn btn-info rounded-circle"
                                                disabled={mintAmount === 1}
                                                onClick={() => { setMintAmount(mintAmount - 1) }}>-</button>
                                            <input type="number" className="mintnum text-center" readOnly value={mintAmount} />
                                            <button type="button"
                                                className="plus btn btn-info rounded-circle"
                                                disabled={mintAmount === info.maxMintAmountPerTx}
                                                onClick={() => { setMintAmount(mintAmount + 1) }}>+</button>
                                        </div>
                                        <div>
                                            <button className="btn btn-info mt-3" onClick={mint}>
                                                {loading ? <CircularProgress color="inherit" size={18} /> : "MINT"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className='my-items'>
                {userNfts.length !== 0 ? (
                    <>
                        <h2 className="minttitle title text-center">My Punks</h2>
                        <div className='items container'>
                            {userNfts.map((nft, index) => {
                                return (
                                    <div className='item-box' key={index}>
                                        <img src={nft.uri} className="item-img" />

                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : null}
            </section>
            <Footer />
        </section>
    )
}

export default MintPage;
