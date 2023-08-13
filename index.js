const server_str = '@alumchat.xyz'

const { client, xml } = require("@xmpp/client");
    
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
class user {
    constructor(username, password) {
        this.username = username
        this.password = password
        console.log(this.username)
        console.log(this.password)
    }

    async login() {
        this.xmpp = client({
            service: 'xmpp://alumchat.xyz:5222',
            domain: 'alumchat.xyz',
            username: this.username,
            password: this.password,
            terminal: true,
            tls: {
                rejectUnauthorized: false
            },
        })

        this.xmpp.on("error", (err) => {
            console.error(err);
        });
    
        this.xmpp.on("offline", () => {
            console.log("offline");
        });
    
        this.xmpp.on("stanza", async (stanza) => {
            if (stanza.is("message")) {
                await xmpp.send(xml("presence", { type: "unavailable" }));
                await xmpp.stop();
            }
        });
    
        this.xmpp.on("online", async (address) => {
            console.log('Onlineeeee')
            return
            // Makes itself available
            await xmpp.send(xml("presence"));
    
            // Sends a chat message to itself
            const message = xml(
                "message",
                { type: "chat", to: address },
                xml("body", {}, "hello world"),
            );
            await xmpp.send(message);
        });

        this.xmpp.start().catch(console.error);
    }
}

username = 'cordova20212gtest'
pass = 'huevos'
const conn = new user(username, pass)
conn.login()

