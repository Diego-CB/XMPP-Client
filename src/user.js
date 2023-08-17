const { client, xml } = require('@xmpp/client')

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
    }

    #restart_xmpp(admin_usr = false) {
        return client({
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
        this.xmpp = this.#restart_xmpp()

        this.xmpp.on('stanza', (stanza) => {
            if (stanza.is('message') && stanza.attrs.type == 'chat') {
                const from = stanza.attrs.from.split('@')[0]
                const body = stanza.getChildText('body')
                print(`-[${from}]-> ${body}`)

            } else if (stanza.is('presence')) {
                if (stanza.attrs.type === 'subscribe') {
                    const request_stanza = xml('presence', { type: 'subscribed', to: stanza.attrs.from })
                    this.xmpp.send(request_stanza)
                } else {
                    const from = stanza.attrs.from.split('@')[0]
                    const status = stanza.getChildText('status')
                    if (status) {
                        print(`-[status:${from}]-> ${status}`)
                    }
                }
            }
        })
        
        return new Promise((resolve, reject) => {
            this.xmpp.on('online', async (address) => {
                const online_stanza = xml('presence', { type: 'online' })
                this.xmpp.send(online_stanza)
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
        const local_xmpp = this.#restart_xmpp(admin=true)

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
        const local_xmpp = this.#restart_xmpp(admin=true)
        
        await new Promise((resolve, reject) => {
    
            local_xmpp.on('error', (err) => {
                reject(err)
            })
            
            local_xmpp.start().then(() => {
                // Envía una solicitud IQ para eliminar la cuenta
                const iq = xml('iq', { type: 'set', id: 'deleteAccount1' },
                    xml('query', { xmlns: 'jabber:iq:register' },
                        xml('remove', {}),
                        xml('username', {}, this.username),
                        xml('password', {}, this.password),
                    )
                )
                local_xmpp.send(iq)

                local_xmpp.on('stanza', async (stanza) => {
                    // Escuchando respuestas IQ (Info/Query)
                    if (stanza.is('iq') && stanza.attrs.type === 'result') {
                        print('Se elimino la cuenta')
                        resolve()
                    }
                })

            }).catch((error) => {
                reject(error)
            })
        })

        await local_xmpp.stop()
    }

    friendRequest(new_friend) {
        const request_stanza = xml('presence', { type: 'subscribe', to: new_friend+ '@alumchat.xyz' })
        this.xmpp.send(request_stanza)
        print('> Solicitud de contacto enviada')
    }

    change_presence(new_presence) {
        const presence = xml('presence', {},
            xml('status', {}, new_presence)
        )
        this.xmpp.send(presence)
        print('> Se cambio la presencia a:', new_presence)
    }

    async getContactList() {
        const local_xmpp = this.#restart_xmpp()

        local_xmpp.on('error', (err) => {
            console.error(err)
        })
        
        await new Promise((resolve, reject) => {
            local_xmpp.start().then(() => {
                // Envía una solicitud de presencia inicial para obtener la lista de contactos
                const presence = xml('presence')
                local_xmpp.send(presence)

                local_xmpp.on('stanza', async (stanza) => {
                    // Escuchando presencias entrantes
                    if (stanza.is('presence') && stanza.attrs.type !== 'error') {
                        const usr = stanza.attrs.from.split('@')[0]
                        const status = stanza.getChildText('status')

                        if (usr !== this.username){
                            print(`> ${usr}: ${status || 'unavailable'}`)
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
}

module.exports = {
    User
}