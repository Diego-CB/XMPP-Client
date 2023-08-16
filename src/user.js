const { client, xml } = require("@xmpp/client")

const { print } = require('./util')

const admin = {
    username: 'dacb1',
    password: 'dacb',
}

class User {
    constructor(username, password) {
        this.username = username
        this.password = password
    }

    #restart_xmpp(admin_usr = false) {
        this.xmpp = client({
            service: 'xmpp://alumchat.xyz:5222',
            domain: 'alumchat.xyz',
            username: admin_usr ? this.username : admin.username,
            password: admin_usr ? this.password : admin.password,
            terminal: true,
            tls: {
                rejectUnauthorized: false
            },
        })
    }

    async login() {
        this.#restart_xmpp(admin=true)

        this.xmpp.on("stanza", async (stanza) => {
            if (stanza.is("message")) {
                await this.xmpp.send(xml("presence", { type: "unavailable" }))
                await this.xmpp.stop()
            }
        })

        return new Promise((resolve, reject) => {
            this.xmpp.on("online", async (address) => {
                print('>', this.username, 'online')
                resolve()
            })
            
            this.xmpp.on("error", (err) => {
                reject(err)
            })
            
            this.xmpp.start().catch(reject)
        })
    }

    async signin() {
        this.#restart_xmpp(admin=true)

        return new Promise((resolve, reject) => {
            this.xmpp.start().then(() => {
                const iq = xml("iq", { type: "set", id: "register1" },
                    xml("query", { xmlns: "jabber:iq:register" },
                        xml("username", {}, this.username),
                        xml("password", {}, this.password),
                    )
                )
                print(iq)
                this.xmpp.send(iq)

                this.xmpp.on("stanza", async (stanza) => {
                    // Escuchando respuestas IQ (Info/Query)
                    if (stanza.is("iq") && stanza.attrs.type === "result") {
                        print('>', this.username, 'registrado')
                        resolve()
                    } else {
                        print('> Error al registrar usuario')
                        reject()
                    }
                })

            }).catch((error) => {
                reject(error)
            })
        })
    }

    async deleteAccount() {
        this.#restart_xmpp(admin=true)
        
        return new Promise((resolve, reject) => {
    
            this.xmpp.on("error", (err) => {
                reject(err)
            })
            
            this.xmpp.start().then(() => {
                // Envía una solicitud IQ para eliminar la cuenta
                const iq = xml("iq", { type: "set", id: "deleteAccount1" },
                    xml("query", { xmlns: "jabber:iq:register" },
                        xml("remove", {}),
                        xml("username", {}, this.username),
                        xml("password", {}, this.password),
                    )
                )
                this.xmpp.send(iq)

                this.xmpp.on("stanza", async (stanza) => {
                    // Escuchando respuestas IQ (Info/Query)
                    if (stanza.is("iq") && stanza.attrs.type === "result") {
                        print("Se elimino la cuenta")
                        resolve()
                    }
                })

            }).catch((error) => {
                reject(error)
            })
        })
    }

    friendRequest(new_friend) {
        const request_stanza = xml("presence", { type: "subscribe", to: new_friend+ '@alumchat.xyz' })
        this.xmpp.send(request_stanza)
        print('> Solicitud de contacto enviada')
    }

    accept_frind_request(new_friend) {
        const request_stanza = xml("presence", { type: "subscribed", to: new_friend+ '@alumchat.xyz' })
        this.xmpp.send(request_stanza)
        print('> Se acepto la solicitud de', new_friend)
    }

    change_presence(new_preence) {
        const presence = xml("presence", {},
            xml("status", {}, new_preence)
        )
        this.xmpp.send(presence)
        print('> Se cambio la presencia a:', new_preence)
    }

    async getContactList() {
        await this.xmpp.stop()
        this.#restart_xmpp()

        this.xmpp.on("error", (err) => {
            console.error(err)
        })

        
        return new Promise((resolve, reject) => {
            this.xmpp.start().then(() => {
                // Envía una solicitud de presencia inicial para obtener la lista de contactos
                const presence = xml("presence")
                this.xmpp.send(presence)

                this.xmpp.on("stanza", async (stanza) => {
                    // Escuchando presencias entrantes
                    if (stanza.is("presence") && stanza.attrs.type !== "error") {
                        print(stanza)
                        const usr = stanza.attrs.from
                        const status = stanza.getChildText("show")

                        if (usr !== this.username){
                            print(`> ${usr}: ${status || 'online'}`)
                        }
                    } else {
                        resolve()
                    }
                })
            }).catch((error) => {
                console.error("Error getting contact list:", error)
            })
        })
    }

    async getContact_info(contact) {
        await this.xmpp.stop()
        this.#restart_xmpp()

        await new Promise((resolve, reject) => {
            this.xmpp.on("stanza", async (stanza) => {
                // Escuchando respuestas IQ (Info/Query)
                if (stanza.is("iq") && stanza.attrs.type === "result") {
                    const queryElement = stanza.getChild("query", "jabber:iq:roster")
                    if (queryElement) {
                        const itemElement = queryElement.getChild("item", { jid: contact })
                        if (itemElement) {
                            const name = itemElement.attrs.name || "No name available"
                            const subscription = itemElement.attrs.subscription || "No subscription status available"
    
                            console.log("Contact JID:", contact)
                            console.log("Contact Name:", name)
                            console.log("Subscription Status:", subscription)
                            resolve()
                        }
                    }
                }
            })

            this.xmpp.start().then(() => {
                // Envía una solicitud IQ de consulta para obtener detalles del contacto
                const iq = xml("iq", { type: "get", id: "contactDetails1" },
                    xml("query", { xmlns: "jabber:iq:roster" })
                )
                this.xmpp.send(iq)
            }).catch((error) => {
                console.error("Error getting contact details:", error)
            })
        })

        await this.xmpp.stop()
        await this.login()
    }
}

module.exports = {
    User
}