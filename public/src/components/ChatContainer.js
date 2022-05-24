import React, {useEffect, useRef, useState} from "react";
import styled from "styled-components";
import Logout from "./Logout";
import ChatInput from "./ChatInput";
import axios from "axios";
import {getAllMessageRoute, sendMessageRoute} from "../utils/ApiRoutes";
import {v4 as uuidv4} from 'uuid'
import {languages} from "../utils/Languages";
import {render} from "react-dom";
// import * as deepl from "deepl-node";

const ChatContainer = ({currentChat, currentUser, socket}) => {
    const [messages, setMessages] = useState([])
    const [arrivalMessage, setArrivalMessage] = useState(null)

    const [translateLang, setTranslateLang] = useState({name: "None"})
    const [translate, setTranslate] = useState(null)

    const DEEPL_API_KEY = "5735d7e3-113a-8810-a9d6-dbb4a7e30cc2:fx"


    const scrollRef = useRef()

    useEffect(() => {
        async function getMessages() {
            if (currentChat) {

                const response = await axios.post(getAllMessageRoute, {
                    from: currentUser._id,
                    to: currentChat._id
                })

                setMessages(response.data)
            }
        }

        getMessages()
    }, [currentChat])


    const handleSendMsg = async (msg) => {
        await axios.post(sendMessageRoute, {
            from: currentUser._id,
            to: currentChat._id,
            message: msg,
        })

        socket.current.emit("send-msg", {
            to: currentChat._id,
            from: currentUser._id,
            message: msg,
        })

        const msgs = [...messages]
        msgs.push({fromSelf: true, message: msg})
        setMessages(msgs)
    }

    useEffect(() => {
        if (socket.current) {
            socket.current.on("msg-receive", (msg) => {
                setArrivalMessage({fromSelf: false, message: msg})
            })
        }
    }, [])

    useEffect(() => {
        arrivalMessage && setMessages((prev) => [...prev, arrivalMessage])
    }, [arrivalMessage])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages])

    const selectLanguage = (language, index) => {
        translateMessages(language)
        setTranslateLang(language)
        setTranslate(index)
    }

    const translateMessages = (language) => {
        if (language !== null)
            if (language?.name !== "None") {
                const messageList = messages

                messageList.forEach((message) => {
                    const params = new URLSearchParams({
                        'auth_key': DEEPL_API_KEY,
                        'target_lang': language.language,
                        'text': message.message
                    })

                    fetch('https://api-free.deepl.com/v2/translate', {
                        method: 'POST',
                        body: params,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded',}
                    })
                        .then(r => r.json())
                        .then(response => {
                            message.message = response.translations[0].text
                        })
                        .catch(error => {
                            console.log(error)
                        })
                })

                setMessages(messageList)
            }
    }

    return (
        <Container>
            <div className={"chat-header"}>
                <div className={"user-details"}>
                    <div className={"avatar"}>
                        <img src={`data:image/svg+xml;base64,${currentChat.avatarImage}`} alt={"avatar"}
                        />
                    </div>
                    <div className={"username"}>
                        <h3>{currentChat.username}</h3>
                    </div>
                </div>

                <Logout/>
            </div>

            <div className={"translate"}>
                <div className={"translate-header"}>
                    Choose language to translate
                </div>
                <div className={"translate-languages"}>
                    {
                        languages.map((language, index) => (
                            <button key={index}
                                    onClick={() => selectLanguage(language, index)}
                                    className={`language-button ${translate === index ? "selected" : ""}`}
                            >
                                {language.name}
                            </button>
                        ))
                    }
                </div>
            </div>

            {/*<Messages*/}
            {/*/>*/}

            <div className={"chat-messages"}>
                {
                    messages.map((message, index) => (
                        <div key={uuidv4()} ref={scrollRef}>
                            <div className={`message ${message.fromSelf ? "sended" : "received"}`}>
                                <div className={"content"}>
                                    <p>
                                        {message.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>

            <ChatInput handleSendMsg={handleSendMsg}
            />
        </Container>
    )
}

const Container = styled.div`
  padding-top: 1rem;
  display: grid;
  grid-template-rows: 6% 25% 60% 9%;
  gap: 0.1rem;
  overflow: hidden;

  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-auto-rows: 15% 70% 15%;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;

    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;

      .avatar {
        img {
          height: 3rem;
        }
      }

      .username {
        h3 {
          color: white;
        }
      }
    }

  }

  .translate {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;

    .translate-header {
      color: white;
      font-size: 1.2rem;
      text-transform: uppercase;
    }

    .translate-languages {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.3rem;

      .language-button {
        padding: 0.3rem 0.5rem;
        border-radius: 0.5rem;
        color: white;
        background-color: #ffffff39;
      }

      .selected {
        background-color: #9186f3;
      }
    }

  }


  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;

    &::-webkit-scrollbar {
      width: 0.2rem;

      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }

    .message {
      display: flex;
      align-items: center;

      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1
      }
    }
  }

  .sended {
    justify-content: flex-end;

    .content {
      background-color: #4f04ff21;
    }
  }

  .received {
    justify-content: flex-start;

    .content {
      background-color: #9900ff20;
    }
  }
`

export default ChatContainer
