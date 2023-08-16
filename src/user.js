const { client, xml } = require("@xmpp/client");

class User {
    constructor(username, password) {
        this.username = username
        this.password = password
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

        this.xmpp.on("stanza", async (stanza) => {
            if (stanza.is("message")) {
                await this.xmpp.send(xml("presence", { type: "unavailable" }));
                await this.xmpp.stop();
            }
        });

        return new Promise((resolve, reject) => {
            this.xmpp.on("online", async (address) => {
                console.log('>', this.username, 'online')
                resolve()
            });
            
            this.xmpp.on("error", (err) => {
                console.error(err);
                reject()
            });
            
            this.xmpp.start().catch(console.error);
        })
    }

    async signin() {
        this.xmpp = client({
            service: 'xmpp://alumchat.xyz:5222',
            domain: 'alumchat.xyz',
            username: 'cordova20212gtest',
            password: 'huevos',
            terminal: true,
            tls: {
                rejectUnauthorized: false
            },
        })

        this.xmpp.on("error", (err) => {
            console.error(err);
        });

        
        return new Promise((resolve, reject) => {
            this.xmpp.start().then(() => {
                const iq = xml("iq", { type: "set", id: "register1" },
                    xml("query", { xmlns: "jabber:iq:register" },
                        xml("username", {}, this.username),
                        xml("password", {}, this.password),
                        xml("label", {}, this.username)
                    )
                )
                this.xmpp.send(iq)

                this.xmpp.on("stanza", async (stanza) => {
                    // Escuchando respuestas IQ (Info/Query)
                    if (stanza.is("iq") && stanza.attrs.type === "result") {
                        console.log('>', this.username, ' registrado')
                        resolve()
                    } else {
                        console.log('> Error al registrar usuario')
                        reject()
                    }
                });

            }).catch((error) => {
                console.error("Error during registration:", error);
            });
        });
    }
}

module.exports = {
    User
}