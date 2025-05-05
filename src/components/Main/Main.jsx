import React, { useContext, useState } from 'react'
import './Main.css'
import {assets} from '../../assets/assets'
import { Context } from '../../context/Context'

const Main = () => {

    const {onSent, recentPrompt, showResult, loading, resultData, input, setInput} = useContext(Context);

  return (
    <div className='main'>
        <div className='nav'>
            <p>J.A.I.</p>
            <img src={assets.user_icon} alt="" />
        </div>
        <div className="main-container">
            {!showResult ? <>
                <div className="greet">
                <p><span>You've come a long way.</span></p>
                <p>How can I help you today?</p>
            </div>
            <div className="cards">
                <div onClick={()=>onSent("What were you created for?")} className="card">
                    <p>What were you created for?</p>
                    <img src={assets.question} alt="" />
                </div>
                <div onClick={()=>onSent("Briefly describe Jolaoluwa")} className="card">
                    <p>Briefly describe Jolaoluwa</p>
                    <img src={assets.bulb_icon} alt="" />
                </div>
                <div onClick={()=>onSent("Brainstorm LinkedIn bullet points for a SWE Internship")} className="card">
                    <p>Brainstorm LinkedIn bullet points for a SWE Internship</p>
                    <img src={assets.message_icon} alt="" />
                </div>
                <div onClick={()=>onSent("Improve the readability of the following code")} className="card">
                    <p>Improve the readability of the following code</p>
                    <img src={assets.code_icon} alt="" />
                </div>
            </div>
            </> : <div className='result'>
                <div className="result-title">
                    <img src={assets.user_icon} alt="" />
                    <p>{recentPrompt}</p>
                </div>
                <div className="result-data">
                    <img src={assets.gemini_icon} alt="" />
                    {loading ? <div className='loader'>
                        <hr />
                        <hr />
                        <hr />
                    </div>: <p dangerouslySetInnerHTML={{__html:resultData}}></p>}
                </div>
                </div>}
            <div className="main-bottom">
                <div className="search-box">
                    <input onChange={(e) =>setInput(e.target.value)} value={input} type="text" placeholder='Enter a prompt here' />
                    <div>
                        <img src={assets.mic_icon} alt="" />
                        {input ? <img onClick={()=>onSent()} src={assets.send_icon} alt="" /> : null}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Main