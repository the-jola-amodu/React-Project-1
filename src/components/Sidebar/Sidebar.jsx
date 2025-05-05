import React, { useContext, useState } from 'react'
import './Sidebar.css'
import {assets} from '../../assets/assets'
import { Context } from '../../context/Context'

const Sidebar = () => {

    const [extended, setExtended] = useState(false)
    const [showAbout, setShowAbout] = useState(false);
    const {onSent, prevPrompts, setRecentPrompt, newChat} = useContext(Context)

    const loadPrompt = async (prompt) => {
        setRecentPrompt(prompt)
        await onSent(prompt)
    }

  return (
    <div className='sidebar'>
        <div className="top">
            <img onClick={() => {setExtended(prev => !prev)}} src={assets.menu_icon} className="menu" />
            <div onClick={()=>newChat()} className='new-chat'>
                <img src={assets.plus_icon} alt="" />
                {extended ? <p>New Chat</p> : null}
            </div>
            {extended ? <div className="recent">
                <p className='recent-title'>Recent</p>
                {prevPrompts.map((item, index)=>{
                    return (
                        <div onClick={()=>loadPrompt(item)} className="recent-entry">
                    <img src={assets.message_icon} alt="" />
                    <p>{item.slice(0, 16)}...</p>
                </div>
                    )
                })}
                
            </div> : null}
        </div>
        <div className="bottom">
            <div onClick={()=>setShowAbout(prev=>!prev)} className="bottom-item recent-entry">
                <img src={assets.question_icon} alt="" />
                {extended ? <p>About</p> : null}
            </div>
            <div className="bottom-item recent-entry">
                <img src={assets.setting_icon} alt="" />
                {extended ? <p>Settings</p> : null}
            </div>
        </div>
        {showAbout && (
            <div className="about">
              Customized RAG using Gemini 2.0 flash, custom system prompt and database
            </div>
          )}
    </div>
  )
}

export default Sidebar