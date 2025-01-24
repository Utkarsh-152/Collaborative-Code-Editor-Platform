import React, { useState, useEffect, useContext, useRef } from 'react'
import axiosInstance from '../config/axios';
import { useLocation } from 'react-router-dom';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import { UserContext } from '../context/user.context';
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import {getWebContainer} from '../config/webContainer'
import { Container } from 'postcss';


// Component to handle syntax highlighting for code blocks
function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {
  // State management for UI components
  const location = useLocation();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // State management for project data
  const [project, setProject] = useState(location.state.project);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');   
  const { user } = useContext(UserContext);
  const messageBox = useRef(null);
  const [messages, setMessages] = useState([]);  
  // State management for file system
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [webContainer, setWebContainer] = useState(null)
  const [iframeURL, setIframeURL] = useState(null)

  useEffect(() => {
    // Initialize socket connection for real-time updates
    initializeSocket(project._id);

    if(!webContainer) {
        getWebContainer().then(container => {
            setWebContainer(container)
            console.log("web container is started")
            
            // If we have a fileTree already, mount it once container is ready
            if (fileTree && Object.keys(fileTree).length > 0) {
                mountFiles(container, fileTree);
            }
        })
    }
    
    // Handle incoming messages and file tree updates
    const cleanup = receiveMessage('project-message', (data) => {
      appendIncomingMessage(data);
      
      // Only try to parse if data.message exists
      if (data.message) {
        try {
          const messageObj = typeof data.message === 'string' 
            ? JSON.parse(data.message)
            : data.message;
          
          if (messageObj.fileTree) {
            setFileTree(messageObj.fileTree);
            if (webContainer) {
              webContainer.mount(messageObj);
            }
          }
        } catch (error) {
          console.warn('Error parsing message:', error);
          // Continue execution even if parsing fails
        }
      }
    });

    // Fetch project details
    axiosInstance.get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
      })
      .catch((err) => {
        console.error('Error fetching project:', err);
      });

    // Fetch all users for collaboration
    axiosInstance.get('/users/all')
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
      });

    return () => {
      if (cleanup) cleanup();
    };
  }, [project._id]);

  // Handle user selection in collaborator modal
  const handleUserSelect = (id) => {
    setSelectedUsers(prevSelectedUsers => {
      const newSelectedUsers = prevSelectedUsers.includes(id)
        ? prevSelectedUsers.filter(userId => userId !== id)
        : [...prevSelectedUsers, id];
      return newSelectedUsers;
    });
  };

  // Send message to all project participants
  function send() {
    const messageObj = {
      message,
      sender: user,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    sendMessage('project-message', messageObj);
    setMessages(prevMessages => [...prevMessages, messageObj]);
    setMessage('');
  }

  // Add selected users as project collaborators
  function addCollaborators() {
    axiosInstance.put('/projects/add-user', {
      projectId: location.state.project._id,
      users: Array.from(selectedUsers)
    })
      .then((res) => {
        console.log('Collaborators added successfully:', res);
      })
      .catch((err) => {
        console.error('Error adding collaborators:', err);
      });
  }

  // Append new messages to the chat
  function appendIncomingMessage(messageObject) {
    setMessages(prevMessages => [...prevMessages, messageObject]);
  }

  // Render AI messages with markdown support
  function writeAiMessage(message) {
    try {
      // If message is already an object, use it directly
      const messageObj = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Check for text property first
      if (messageObj.text) {
        return (
          <div className="prose prose-invert max-w-none">
            <Markdown
              options={{
                overrides: {
                  code: { component: SyntaxHighlightedCode },
                  pre: {
                    component: ({ children, ...props }) => (
                      <pre {...props} className="bg-black/50 rounded-lg my-2">
                        {children}
                      </pre>
                    )
                  }
                }
              }}
            >
              {messageObj.text}
            </Markdown>
          </div>
        );
      }
      
      // If no text property, try to stringify the message content
      const textContent = typeof messageObj.message === 'string' 
        ? messageObj.message 
        : JSON.stringify(messageObj.message, null, 2);

      return (
        <div className="prose prose-invert max-w-none">
          <Markdown
            options={{
              overrides: {
                code: { component: SyntaxHighlightedCode },
                pre: {
                  component: ({ children, ...props }) => (
                    <pre {...props} className="bg-black/50 rounded-lg my-2">
                      {children}
                    </pre>
                  )
                }
              }
            }}
          >
            {textContent}
          </Markdown>
        </div>
      );
    } catch (error) {
      console.error('Error parsing AI message:', error, message);
      return (
        <div className="prose prose-invert max-w-none">
          <p className="text-red-400">Error displaying message</p>
        </div>
      );
    }
}
  

  // Add this helper function at the top of your file with other functions
  function getLanguageFromFileName(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      // Add more mappings as needed
    };
    return languageMap[extension] || 'plaintext';
  }

  // Add this helper function
  async function mountFiles(container, files) {
    try {
        console.log('Attempting to mount files:', files);
        
        // Convert file tree to WebContainer format if needed
        const webContainerFiles = Object.entries(files).reduce((acc, [path, content]) => {
            acc[path] = {
                file: {
                    contents: content.file?.contents || content
                }
            };
            return acc;
        }, {});

        console.log('Mounting files in WebContainer format:', webContainerFiles);
        await container.mount(webContainerFiles);
        console.log('Files mounted successfully');
    } catch (error) {
        console.error('Error mounting files:', error);
    }
  }

  return (
    <main className='h-screen w-screen flex'>
        <section className='left fixed w-[30%] max-w-[500px] h-screen flex flex-col bg-[#1E1E1E]'>
            <header className='flex h-[50px] bg-[#252526] justify-between items-center py-3 px-4 border-b border-[#3E3E42] flex-shrink-0'>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className='bg-[#2D2D2D] p-2 flex items-center gap-2 rounded-md hover:bg-[#3E3E42] text-gray-300 hover:text-emerald-400 transition-all duration-300 group'
                >
                    <i className="ri-user-add-line group-hover:scale-110 transform transition-transform"></i>
                    <span className='text-xs font-semibold text-gray-300'>Add Collaborators</span>
                </button>
                <button 
                    className='bg-[#2D2D2D] p-2 rounded-md hover:bg-[#3E3E42] text-gray-300 hover:text-emerald-400 transition-all duration-300 group'
                    onClick={() => setSidePanelOpen(!sidePanelOpen)}
                >
                    <i className="ri-group-fill group-hover:scale-110 transform transition-transform"></i>
                </button>
            </header>

            <div className='conversation-area flex flex-col flex-grow overflow-hidden'>
                <div
                 ref={messageBox}
                 className='messages-area flex-1 w-full bg-[#1E1E1E] p-4 overflow-y-auto'>
                  {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`message flex flex-col mb-6 ${msg.sender._id === user._id ? 'items-end' : 'items-start'} w-full`}
                    >
                        <div className="flex items-center gap-2 mb-1 px-2">
                            {msg.sender._id !== user._id && (
                                <div className="w-8 h-8 rounded-full bg-[#2D2D2D] flex items-center justify-center">
                                    <i className={`${msg.sender._id === 'ai' ? 'ri-speak-ai-fill' : 'ri-user-fill'} text-emerald-400`}></i>
                                </div>
                            )}
                            <span className="text-xs text-gray-500 font-medium">{msg.sender.email}</span>
                            <span className="text-xs text-gray-600">• {msg.timestamp}</span>
                            {msg.sender._id === user._id && (
                                <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                    <i className="ri-user-fill text-emerald-400"></i>
                                </div>
                            )}
                        </div>
                        <div className={`
                            px-4 py-3 rounded-2xl shadow-md
                            ${msg.sender._id === user._id 
                                ? 'bg-emerald-600/20 mr-2 rounded-tr-none' 
                                : msg.sender._id === 'ai'
                                    ? 'bg-zinc-950 ml-2 rounded-tl-none max-w-[90%]'
                                    : 'bg-[#2D2D2D] ml-2 rounded-tl-none'
                            }
                        `}>
                            {msg.sender._id === 'ai' ? (
                                writeAiMessage(msg.message)
                            ) : (
                                <p className="text-gray-200 leading-relaxed">{msg.message}</p>
                            )}
                        </div>
                    </div>
                  ))}
                </div>

                <div className='input-field bg-[#252526] mt-2 p-2 border-t border-[#3E3E42] flex-shrink-0'>
                    <div className='flex gap-1'>
                        <div className='flex-grow relative'>
                            <input 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                type="text" 
                                
                                placeholder='Type your message...' 
                                className='w-full p-2 px-2 bg-[#2D2D2D] text-gray-300 rounded-md border border-[#3E3E42] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all duration-300 font-mono placeholder-gray-600'
                            />
                        </div>
                        <button 
                            onClick={() => send()}
                            className='bg-emerald-600 p-2 rounded-md hover:bg-emerald-500 transition-all duration-300 group shadow-lg hover:shadow-emerald-900/20'>
                            <i className="ri-send-plane-fill text-white group-hover:translate-x-1 transform transition-transform"></i>
                        </button>
                    </div>
                    
                </div>
            </div>
            <div className={`sidePanel w-full h-full bg-[#252526] rounded-md absolute top-0 left-[-100%] transition-all duration-300 ${sidePanelOpen ? 'translate-x-[100%]' : ''}`}>

                <header className='flex bg-[#2D2D2D] justify-between items-center p-4 border-b border-[#3E3E42]'>
                    <h2 className='text-emerald-400 shadow-lg text-lg font-bold'>Collaborators</h2>
                    <button 
                        onClick={() => setSidePanelOpen(!sidePanelOpen)}
                        className='bg-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-500 transition-all duration-300 group shadow-lg hover:shadow-emerald-900/20'>
            
                        <i className="ri-close-fill text-white group-hover:translate-x-1 transform transition-transform"></i>
                    </button>
                </header>

                <div className='members-list flex flex-col gap-2 p-4'>
                    {project.users && project.users.map(users => {
                        return (
                            <div className='member flex items-center gap-2'>
                                <div className='w-10 h-10 rounded-full  bg-[#2D2D2D] flex items-center justify-center'>
                                    <i className="ri-user-fill text-emerald-400"></i>
                                </div>
                                <div className='flex flex-col text-white text-sm bg-[#2D2D2D] p-2 rounded-md shadow-lg hover:scale-[105%] duration-300 hover:shadow-black transition-shadow'>
                                    <small className='text-lg text-gray-300'>{users.email}</small>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>

        <section className="right ml-[30%] max-w-[70%] h-screen flex flex-grow bg-[#161616] overflow-hidden">
            <div className="explorer max-w-52 min-w-52 h-full flex-grow border-r border-[#3E3E42] bg-[#181818]">
                <div className="fileTree">
                    {Object.keys(fileTree || {}).map((file, index) => {
                        return (
                            <button 
                                key={index}
                                onClick={() => {
                                    setCurrentFile(file);
                                    setOpenFiles(prevOpenFiles =>[... new Set([...prevOpenFiles, file])]);
                                }}
                                className="treeElement cursor-pointer hover:bg-black transition-all duration-100 justify-center ml-2 mr-2 mt-2  rounded-md p-2 border border-[#3E3E42] bg-[#252526] flex items-center gap-2">
                                <i className="ri-folder-fill text-emerald-500"></i>
                                <span className="text-gray-300">{file}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

                
            <div className="code-editor h-full p-2 flex flex-col flex-grow">
              {iframeURL && webContainer && 
                <iframe src={iframeURL} className="w-1/2 h-full"></iframe>
              }
                <div className="top flex items-center p-2 rounded-md">
                    <div className='files flex'>  
                    {openFiles.map((file, index) => (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentFile(file)}
                                className="text-gray-300 text-md p-2 font-semibold">{file}</button> 
                            <button 
                                onClick={() => setOpenFiles(prevOpenFiles => prevOpenFiles.filter(f => f !== file))}
                                className="bg-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-500 transition-all duration-300 group shadow-lg hover:shadow-emerald-900/20">
                                <i className="ri-close-fill text-white group-hover:translate-x-1 transform transition-transform"></i>
                            </button>   
                        </div>
                        ))}
                    </div>
                    <div className='actions flex items-center gap-2 ml-auto'>
                        <button 
                            onClick={async () => {
                                if (!fileTree || !webContainer) {
                                    console.error('Missing fileTree or webContainer:', { fileTree, webContainer });
                                    return;
                                }

                                try {
                                    // Mount files first
                                    await mountFiles(webContainer, fileTree);
                                    console.log('Files mounted, proceeding with npm commands');

                                    // Check if package.json exists in the file tree
                                    if (!fileTree['package.json']) {
                                        console.error('No package.json found in file tree');
                                        // Optionally show an error message to the user
                                        return;
                                    }

                                    // Run npm install
                                    const installProcess = await webContainer?.spawn('npm', ['install']);
                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk);
                                        }
                                    }));

                                    // Wait for install to complete before running start
                                    await installProcess.exit;

                                    // Run npm start
                                    const runProcess = await webContainer?.spawn('npm', ['start']);
                                    runProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk);
                                        }
                                    }));

                                    webContainer.on('server-ready', (port, url) => {
                                        setIframeURL(url);
                                        console.log(port, url);
                                    });
                                } catch (error) {
                                    console.error('Error in run process:', error);
                                }
                            }}
                            className='bg-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-500 transition-all duration-300 group shadow-lg hover:shadow-emerald-900/20'>
                            <h1 className='text-white'>Run</h1>
                        </button>
                    </div>
                </div>
                <div className="bottom flex flex-col flex-grow">
                    {fileTree[currentFile] && (
                        <pre className="hljs h-full">
                            <code
                                className={`hljs h-full outline-none ${getLanguageFromFileName(currentFile)}`}
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    const updatedContent = e.target.innerText;
                                    const ft = {
                                        ...fileTree,
                                        [currentFile]: {
                                            file: {
                                                contents: updatedContent
                                            }
                                        }
                                    }
                                    setFileTree(ft)
                                    saveFileTree(ft)
                                }}
                                dangerouslySetInnerHTML={{ 
                                    __html: hljs.highlightAuto(fileTree[currentFile].file.contents).value 
                                }}
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    paddingBottom: '25rem',
                                    counterSet: 'line-numbering',
                                }}
                            />
                        </pre>
                    )} 
                </div>
            </div>
              
        </section>
      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#252526] rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#3E3E42]">
              <h2 className="text-lg font-semibold text-emerald-400">Select Users</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {users.map(user => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user._id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedUsers.includes(user._id)
                      ? 'bg-emerald-600/20 border border-emerald-500'
                      : 'bg-[#2D2D2D] border border-[#3E3E42] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-fill text-emerald-400"></i>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-gray-200 font-semibold text-lg truncate">{user.email}</span>
                  </div>
                  {selectedUsers.includes(user._id) && (
                    <i className="ri-check-line text-emerald-400 text-xl"></i>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#3E3E42] flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#2D2D2D] text-gray-300 hover:bg-[#3E3E42] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  addCollaborators();
                }}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                Confirm ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Project