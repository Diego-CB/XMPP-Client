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

        this.xmpp.on("error", (err) => {
            console.error(err);
        });
    
        this.xmpp.on("stanza", async (stanza) => {
            if (stanza.is("message")) {
                await xmpp.send(xml("presence", { type: "unavailable" }));
                await xmpp.stop();
            }
        });

        this.xmpp.start().catch(console.error);
    }

    async signin() {
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

        this.xmpp.on("stanza", async (stanza) => {
            // Escuchando respuestas IQ (Info/Query)
            if (stanza.is("iq") && stanza.attrs.type === "result") {
                console.log("Registration successful!");
                await this.xmpp.stop();
            }
        });

        this.xmpp.start().then(() => {
            print('llego xdxdxd')
            // // Envía una solicitud IQ de registro
            // const iq = xml("iq", { type: "set", id: "register1" },
            //     xml("query", { xmlns: "jabber:iq:register" },
            //         xml("username", {}, this.username),
            //         xml("password", {}, this.password)
            //     )
            // );
            // const iq_request = `
            // <iq from="${this.username}@alumchat.xyz" to="${this.username}@alumchat.xyz" type="get" >
	        //     <query xmlns="jabber:iq:roster"/> 
            // </iq>
            // `
            // console.log(iq_request)
            // this.xmpp.send(iq);

            const iq_request = `
            <iq type='get' id='reg1' to='alumchat.xyz'>
                <query xmlns='jabber:iq:register'/>
            </iq>
            `
            this.xmpp.send(iq_request);

        }).catch((error) => {
            console.error("Error during registration:", error);
        });
    }
}

module.exports = {
    User
}