const API_KEY = 'AIzaSyDLIJwvq5ucqcMputTR1A_lT-Q_VJQln_U'; // GANTI DENGAN KUNCI API ANDA!
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Fungsi untuk mengirim pesan
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    addMessageToChat(message, 'user-message');
    userInput.value = '';
    userInput.disabled = true; // Nonaktifkan input saat menunggu respons

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{
                        "text": message
                    }]
                }]
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const rawBotMessage = data.candidates[0].content.parts[0].text;
        
        // Panggil fungsi untuk memformat pesan bot
        const formattedBotMessage = formatMessage(rawBotMessage);

        addMessageToChat(formattedBotMessage, 'bot-message');
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi nanti.', 'bot-message');
    } finally {
        userInput.disabled = false; // Aktifkan kembali input
        userInput.focus(); // Fokuskan kursor
    }
}

// Fungsi untuk memformat pesan dari AI (mengubah markdown menjadi HTML)
function formatMessage(text) {
    let formattedText = text;

    // Mengubah bold (**teks**) menjadi <strong>teks</strong>
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Mengubah kode inline (`a<sub>ij</sub>`) menjadi <code>a<sub>ij</sub></code>
    formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');

    // Mengubah daftar (* item) menjadi list HTML
    formattedText = formattedText.replace(/^\s*\*(.*)/gm, '<li>$1</li>');
    if (formattedText.includes('<li>')) {
        formattedText = `<ul>${formattedText}</ul>`;
    }

    // Mengubah tabel Markdown menjadi tabel HTML
    if (formattedText.includes('|')) {
        let lines = formattedText.split('\n');
        let tableHTML = '<table class="gemini-table">';
        let isHeader = true;

        for (const line of lines) {
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                // Ignore the separator line `|---|---|`
                if (line.includes('---')) continue;

                const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
                if (isHeader) {
                    tableHTML += '<thead><tr>';
                    cells.forEach(cell => tableHTML += `<th>${cell}</th>`);
                    tableHTML += '</tr></thead><tbody>';
                    isHeader = false;
                } else {
                    tableHTML += '<tr>';
                    cells.forEach(cell => tableHTML += `<td>${cell}</td>`);
                    tableHTML += '</tr>';
                }
            }
        }
        tableHTML += '</tbody></table>';
        formattedText = tableHTML;
    }
    
    return formattedText;
}

// Fungsi untuk menambahkan pesan ke chat
function addMessageToChat(text, className) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    
    // Gunakan innerHTML untuk menampilkan HTML yang sudah diformat
    messageElement.innerHTML = text;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Tambahkan event listener untuk tombol 'Kirim' dan tombol 'Enter'
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});