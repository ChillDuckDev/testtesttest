import React from 'react';
import "../assets/styles.css";
import NavBar from './NavBar';
import { AiOutlineGithub } from "react-icons/ai";

function Hero() {
    return (
        <section className='hero'>
            <NavBar />
            <div className="caption">
                <p className='text-center' style={{ color: "#000", fontSize: "20px" }}>Mint Your Punks</p>
                <div className="caption-inner">
                    <a href="/mint-page">
                        <button className="btn btn-danger" style={{ color: "#000" }}>
                            Mint Now
                        </button>
                    </a>
                </div>
            </div>
        </section>
    )
}

export default Hero
