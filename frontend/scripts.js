const loginContainer = document.getElementById('login-container');
const chatInterface = document.getElementById('chat-interface');
const loginForm = document.getElementById('login-form');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const threadList = document.getElementById('thread-list');
const newThreadButton = document.getElementById('new-thread-button');
const threadsContainer = document.getElementById('threads-container');

const apiKey = '';
const apiBaseUrl = 'http://localhost:3001/api';

const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
};

let currentUser = null;
let currentThread = null;

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Mirem si l'usuari esta!
    
    currentUser = username;
    loginContainer.style.display = 'none';
    chatInterface.style.display = 'flex';
    loadUserThreads();
});

function loadUserThreads() {
    // Carguem els threads de l'usuari!
    const dummyThreads = ['Perritos', 'Manual', 'Comida'];


    threadList.innerHTML = '';
    dummyThreads.forEach(thread => {
        const li = document.createElement('li');
        li.textContent = thread;
        li.addEventListener('click', () => selectThread(thread));
        threadList.appendChild(li);
    });
}

function selectThread(threadName) {
    currentThread = threadName;
    chatContainer.innerHTML = '';
    addMessage(`Estas al chat ${threadName}!`);
    
    // Resaltar el hilo seleccionado
    document.querySelectorAll('#thread-list li').forEach(li => {
        li.classList.remove('selected');
        if (li.textContent === threadName) {
            li.classList.add('selected');
        }
    });

    if (window.innerWidth < 768) {
        threadsContainer.style.display = 'none';
    }
}

newThreadButton.addEventListener('click', async () => {
    const threadName = prompt('Nom:');
    if (threadName) {
        const newThread = await createThread(threadName);
        if (newThread) {
            selectThread(newThread.name); // Seleccionar el nuevo hilo
            const li = document.createElement('li');
            li.textContent = newThread.name;
            li.addEventListener('click', () => selectThread(newThread.name));
            threadList.appendChild(li);
        }
    }
});

async function createThread(threadName) {
    const url = `${apiBaseUrl}/v1/workspace/stic/thread/new`;
    const slug = threadName.toLowerCase().replace(" ", "-");
    const data = {
        userId: 1, // Username hash !!!
        name: threadName,
        slug: slug
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            const thread = result.thread || {};
            alert(`El hilo '${thread.name}' ha sido creado con éxito!`);
            return thread;
        } else if (response.status === 403) {
            alert("Error: No se encontró una API Key válida.");
        } else if (response.status === 400) {
            alert("Error: Solicitud incorrecta.");
        } else {
            alert(`Error al crear el hilo. Código de estado: ${response.status}`);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Hubo un problema al intentar crear el hilo.");
    }

    return null;
}

function addMessage(message, isUser = false, sources = []) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    
    const cleanedMessage = message.replace(/\n/g, '<br>');
    
    messageElement.innerHTML = cleanedMessage;
    chatContainer.appendChild(messageElement);

    if (!isUser && sources.length > 0) {
        const docsElement = document.createElement('div');
        docsElement.classList.add('referenced-docs');
        
        const dropdownButton = document.createElement('button');
        dropdownButton.classList.add('dropdown-button');
        dropdownButton.textContent = 'Documents referenciats';
        docsElement.appendChild(dropdownButton);

        const dropdownContent = document.createElement('div');
        dropdownContent.classList.add('dropdown-content');
        
        sources.forEach(source => {
            const docElement = document.createElement('div');
            docElement.classList.add('doc-reference');
            docElement.innerHTML = `
                <h4>${source.title}</h4>
                <p>${source.text}</p>
            `;
            dropdownContent.appendChild(docElement);
        });
        
        docsElement.appendChild(dropdownContent);
        messageElement.appendChild(docsElement);

        dropdownButton.addEventListener('click', () => {
            dropdownContent.classList.toggle('show');
        });
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentThread) {
        addMessage(message, true);
        messageInput.value = '';
        
        const threadSlug = currentThread.toLowerCase().replace(" ", "-");
        const url = `${apiBaseUrl}/v1/workspace/stic/thread/${threadSlug}/chat`;
        
        const payload = {
            role: "user",
            message: message,
            mode: "chat"
        };

        fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
            const botResponse = data.textResponse || "Gracias por tu mensaje. Esta es una respuesta predeterminada.";
            console.log("Respuesta del bot:", botResponse);
            addMessage(botResponse, false, data.sources);            
        })
        .catch(error => {
            console.error("Error de red:", error);
            addMessage("Hi ha hagut un error en la connexió. Intenta-ho de nou més tard.");
        });
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Mensaje inicial del bot
addMessage('Benvingut a ChatEPSEVG! Si us plau, selecciona o crea un fil per començar.');
