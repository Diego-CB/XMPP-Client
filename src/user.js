const { client, xml } = require('@xmpp/client')
const fs = require('fs');
const { print } = require('./util')

const admin = {
    username: 'dacb1',
    password: 'dacb',
}

class User {
    constructor(username, password) {
        this.username = username
        this.password = password
        this.xmpp = undefined
        this.contacts = []
    }

    #restart_xmpp(admin_usr = false) {
        const username = admin_usr ? admin.username : this.username
        const password = admin_usr ? admin.password : this.password
        return client({
            service: 'xmpp://alumchat.xyz:5222',
            domain: 'alumchat.xyz',
            username: username,
            password: password,
            terminal: true,
            tls: {
                rejectUnauthorized: false
            },
        })
    }

    async login() {
        this.xmpp = this.#restart_xmpp()

        // Notificaciones
        this.xmpp.on('stanza', (stanza) => {
            if (stanza.is('message')) {

                // Recibir mensajes directos
                if (stanza.attrs.type == 'chat') {
                    const from = stanza.attrs.from.split('@')[0]
                    const body = stanza.getChildText('body')
                    
                    // Recibir archivos adjuntos
                    const coded_data = stanza.getChildText('attachment')
                    if (coded_data) {
                        const decodedData = Buffer.from(coded_data, 'base64');
                        const filepath = `./files/${body}`
                        fs.writeFileSync(filepath, decodedData);
                        print(`-[${from}]-> ${body}`)
                        print('> archivo recibido guardado en:', filepath)
                    } else {
                        print(`-[${from}]-> ${body}`)
                    }
                    
                // Recibir mensajes grupales
                } else if (stanza.attrs.type == 'groupchat') {
                    const group = stanza.attrs.from.split('@')[0]
                    const from = stanza.attrs.from.split('/')[1]
                    const body = stanza.getChildText('body')
                    if (body && from) {
                        print(`-[${group}:${from}]-> ${body}`)
                    }
                }
            
            } else if (stanza.is('presence')) {
                // Aceptar solicitudes de contacto entrantes
                if (stanza.attrs.type === 'subscribe') {
                    const request_stanza = xml('presence', { type: 'subscribed', to: stanza.attrs.from })
                    this.xmpp.send(request_stanza)
                    print('> Se acepto solicitud de:', stanza.attrs.from.split('@')[0])

                // Recibir cambios de status de contactos
                } else {
                    const from = stanza.attrs.from.split('@')[0]
                    if (from != this.username) {
                        const status = stanza.getChildText('status')
                        if (status) {
                            print(`-[status:${from}]-> ${status}`)
                        }
                    }
                }
            }
        })
        
        return new Promise((resolve, reject) => {
            this.xmpp.on('online', async (address) => {
                const online_stanza = xml('presence', {},
                    xml('show', {}, 'available')
                )
                await this.xmpp.send(online_stanza)

                print('>', this.username, 'online')
                resolve()
            })

            this.xmpp.on('error', (err) => {
                reject(err)
            })
            
            
            this.xmpp.start().catch(reject)
        })
    }

    async signin() {
        const local_xmpp = this.#restart_xmpp(true)

        await new Promise((resolve, reject) => {
            local_xmpp.start().then(() => {
                const iq = xml('iq', { type: 'set', id: 'register1' },
                    xml('query', { xmlns: 'jabber:iq:register' },
                        xml('username', {}, this.username),
                        xml('password', {}, this.password),
                    )
                )
                local_xmpp.send(iq)

                local_xmpp.on('stanza', async (stanza) => {
                    // Escuchando respuestas IQ (Info/Query)
                    if (stanza.is('iq') && stanza.attrs.type === 'result') {
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

        await local_xmpp.stop()
    }

    async deleteAccount() {
        const local_xmpp = this.#restart_xmpp(true)
        print(local_xmpp)
        
        await new Promise((resolve, reject) => {
    
            local_xmpp.on('error', (err) => {
                reject(err)
            })

            local_xmpp.on('stanza', async (stanza) => {
                // Escuchando respuestas IQ (Info/Query)
                if (stanza.is('iq') && stanza.attrs.type === 'result') {
                    print('Se elimino la cuenta')
                    resolve()
                }
            })
            
            local_xmpp.start().then(() => {
                print('empezo')
                // Envía una solicitud IQ para eliminar la cuenta
                const iq = xml('iq', { type: 'set', id: 'deleteAccount1' },
                    xml('query', { xmlns: 'jabber:iq:register' },
                        xml('remove', {},
                            xml('username', {}, this.username)
                        ),
                    )
                )
                print(iq)
                local_xmpp.send(iq)

            }).catch((error) => {
                reject(error)
            })
        })

        await local_xmpp.stop()
    }

    async friendRequest(new_friend) {
        const request_stanza = xml('presence', { type: 'subscribe', to: new_friend+ '@alumchat.xyz' })
        await this.xmpp.send(request_stanza)
        print('> Solicitud de contacto enviada')
    }

    async change_presence(new_presence) {
        const presence = xml('presence', {},
            xml('status', {}, new_presence)
        )
        await this.xmpp.send(presence)
        print('> Se cambio la presencia a:', new_presence)
    }

    async send_dm(destin, msg) {
        const msg_stanza = xml(
            'message', {
                from: this.username + '@alumchat.xyz', 
                to: destin + '@alumchat.xyz',
                type: 'chat',
            },
            xml('body', {}, msg)
        )
        await this.xmpp.send(msg_stanza)
        print('> Se envio mensaje a', destin)  
    }

    async send_file(destin, filePath) {
        const fileData = fs.readFileSync(filePath, { encoding: 'base64' })
        const msg = filePath.replace('./', '')
        const file_stanza = xml(
            'message',
            { to: destin + '@alumchat.xyz', type: 'chat' },
            xml('body', {}, msg),
            xml('attachment', { 
                xmlns: 'urn:xmpp:attachment',
                id: 'attachment1',
                encoding: 'base64'
            }, fileData)
        )

        await this.xmpp.send(file_stanza)
        print(`> Archivo ${filePath} enviado a: ${destin}`)
    }

    async getContactList(to_print=true) {
        const local_xmpp = this.#restart_xmpp()

        local_xmpp.on('error', (err) => {
            console.error(err)
        })
        
        await new Promise((resolve, reject) => {
            let user_count = 0
            local_xmpp.start().then(() => {
                // Envía una solicitud de presencia inicial para obtener la lista de contactos
                const presence = xml('presence')
                local_xmpp.send(presence)

                local_xmpp.on('stanza', async (stanza) => {
                    // Escuchando presencias entrantes
                    if (stanza.is('presence') && stanza.attrs.type !== 'error') {
                        const usr = stanza.attrs.from.split('@')[0]
                        if (usr !== this.username) {

                            if (!this.contacts.includes(usr)) {
                                this.contacts.push(usr)
                                user_count++
                            }
                            
                            if (to_print) {
                                const status = stanza.getChildText('status')
                                print(`> ${usr}: ${status || 'unavailable'}`)
                            }
                        }
                    } else {
                        resolve()
                    }
                })
            }).catch((error) => {
                console.error('Error getting contact list:', error)
            })
        })

        await local_xmpp.stop()
    }

    async getContact_info(contact) {
        const local_xmpp = this.#restart_xmpp()
        contact = contact + '@alumchat.xyz'

        await new Promise((resolve, reject) => {
            local_xmpp.on('stanza', async (stanza) => {
                if (stanza.is('iq') && stanza.attrs.type === 'result') {
                    const queryElement = stanza.getChild('query', 'jabber:iq:roster')
                    if (queryElement) {
                        const itemElement = queryElement.getChildren('item')
                        if (itemElement.length > 0) {
                            let founded = 0
                            itemElement.map(i => {
                                if (i.attrs.jid === contact) {
                                    print('JID:', i.attrs.jid)

                                    try {
                                        const name = i.attrs.name
                                        print('Nombre:', name)
                                    } catch (error) {}
                                    
                                    try {
                                        const email = i.attrs.email
                                        print('Email:', email)
                                    } catch (error) {}
                                    
                                    let subscription = i.attrs.subscription
                                    subscription = (subscription === 'to') 
                                        ? 'Estas subscrito' 
                                        : (subscription === 'none') ? 'Le enviaste solicitud'
                                            : 'Ambos estan subscritos'
                                    print('Subscription:', subscription)
        
                                    founded++
                                }
                            })

                            if (founded < 1) {
                                print('> No se encontro el usuario')
                            }
                            resolve()
                        }
                    }
                }
            })

            local_xmpp.start().then(() => {
                const iq = xml('iq', {type:'get'},
                    xml('query', { xmlns: 'jabber:iq:roster'})
                )
                local_xmpp.send(iq)
            }).catch((error) => {
                console.error('Error getting contact details:', error)
            })
        })

        await local_xmpp.stop()
    }
    
    async createGroupChat(grupo) {
        const group_stanza = xml( 'presence', {
                to: `${grupo}@conference.alumchat.xyz/${this.username}`,
                from: `${this.username}@conference.alumchat.xyz/${this.username}`
            },
            xml( 'x', { xmlns: 'http://jabber.org/protocol/muc#user'},
                xml( 'item', {
                    jid: `${this.username}`,
                    affiliation: 'owner',
                    role: 'moderator'
                })
            )   
        )
        
        try {
            await this.xmpp.send(group_stanza)
            print('> Se creo el grupo exitosamente')

        } catch (error) {
            print('> Error al crear grupo')   
        }
    }

    async send_groupChat(destin, msg) {
        const msg_stanza = xml(
            'message', {
                from: this.username + '@alumchat.xyz', 
                to: `${destin}@conference.alumchat.xyz`,
                type: 'groupchat',
            },
            xml('body', {}, msg)
        )

        try {
            await this.xmpp.send(msg_stanza)
            print('> Se envio mensaje al grupo', destin)  
            
        } catch (error) {
            print('> Error al enviar mensaje al grupo', destin)  
        }
    }

    async invite_groupChat(grupo, contact) {

        try {
            const invite_stanza = xml( "iq", { xmlns:"jabber:client", to: `${grupo}@conference.alumchat.xyz`, type: "set" },
                xml("query", { xmlns: "http://jabber.org/protocol/muc#admin" },
                xml("item", { jid: `${contact}@alumchat.xyz`, affiliation: "member" })
            ))
            await this.xmpp.send(invite_stanza)
            print('> Se invito a', contact, 'al grupo', grupo)
            
        } catch (error) {
            print('> Error al invitar a', contact, 'al grupo', grupo)
            
        }
    }

    async accept_invite(grupo) {
        const accept_stanza = xml("presence", {
                xmlns:"jabber:client",
                to: `${grupo}@conference.alumchat.xyz/${this.username}`,
            }, xml("x", {xmlns:"http://jabber.org/protocol/muc"})
        )

        await this.xmpp.send(accept_stanza)
    }
}

module.exports = {
    User
}