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
        this.#restart_xmpp()

        this.xmpp.on('stanza', (stanza) => {
            if (stanza.is('message') && stanza.attrs.type == 'chat') {
                const from = stanza.attrs.from.split('@')[0]
                const body = stanza.getChildText('body')
                print(`-[${from}]-> ${body}`)
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
        this.#restart_xmpp(admin=true)

        return new Promise((resolve, reject) => {
            this.xmpp.start().then(() => {
                const iq = xml('iq', { type: 'set', id: 'register1' },
                    xml('query', { xmlns: 'jabber:iq:register' },
                        xml('username', {}, this.username),
                        xml('password', {}, this.password),
                    )
                )
                this.xmpp.send(iq)

                this.xmpp.on('stanza', async (stanza) => {
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
    }

    async deleteAccount() {
        this.#restart_xmpp(admin=true)
        
        return new Promise((resolve, reject) => {
    
            this.xmpp.on('error', (err) => {
                reject(err)
            })
            
            this.xmpp.start().then(() => {
                // Envía una solicitud IQ para eliminar la cuenta
                const iq = xml('iq', { type: 'set', id: 'deleteAccount1' },
                    xml('query', { xmlns: 'jabber:iq:register' },
                        xml('remove', {}),
                        xml('username', {}, this.username),
                        xml('password', {}, this.password),
                    )
                )
                this.xmpp.send(iq)

                this.xmpp.on('stanza', async (stanza) => {
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
    }

    friendRequest(new_friend) {
        const request_stanza = xml('presence', { type: 'subscribe', to: new_friend+ '@alumchat.xyz' })
        this.xmpp.send(request_stanza)
        print('> Solicitud de contacto enviada')
    }

    accept_frind_request(new_friend) {
        const request_stanza = xml('presence', { type: 'subscribed', to: new_friend+ '@alumchat.xyz' })
        this.xmpp.send(request_stanza)
        print('> Se acepto la solicitud de', new_friend)
    }

    change_presence(new_presence) {
        print('entro presencia')
        const presence = xml('presence', {},
            xml('status', {}, new_presence)
        )
        this.xmpp.send(presence)
        print('> Se cambio la presencia a:', new_presence)
    }

    async getContactList() {
        await this.xmpp.stop()
        this.#restart_xmpp()

        this.xmpp.on('error', (err) => {
            console.error(err)
        })

        
        return new Promise((resolve, reject) => {
            this.xmpp.start().then(() => {
                // Envía una solicitud de presencia inicial para obtener la lista de contactos
                const presence = xml('presence')
                this.xmpp.send(presence)

                this.xmpp.on('stanza', async (stanza) => {
                    // Escuchando presencias entrantes
                    if (stanza.is('presence') && stanza.attrs.type !== 'error') {
                        const usr = stanza.attrs.from
                        const status = stanza.getChildText('show')

                        if (usr !== this.username){
                            print(`> ${usr}: ${status || 'online'}`)
                        }
                    } else {
                        resolve()
                    }
                })
            }).catch((error) => {
                console.error('Error getting contact list:', error)
            })
        })
    }

    async getContact_info(contact) {
        await this.xmpp.stop()
        this.#restart_xmpp()
        contact = contact + '@alumchat.xyz'

        await new Promise((resolve, reject) => {
            this.xmpp.on('stanza', async (stanza) => {
                if (stanza.is('iq') && stanza.attrs.type === 'result') {
                    const queryElement = stanza.getChild('query', 'jabber:iq:roster')
                    if (queryElement) {
                        const itemElement = queryElement.getChildren('item')
                        if (itemElement.length > 0) {
                            let founded = 0
                            const item = itemElement.map(i => {
                                // print(i)
                                // print(i.attrs.jid)
                                // print(i.attrs.subscription)

                                if (i.attrs.jid === contact) {
                                    const name = i.attrs.jid
                                    const subscription = i.attrs.subscription
        
                                    console.log('Contact JID:', name)
                                    console.log('Subscription Status:', subscription)
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

            this.xmpp.start().then(() => {
                // Envía una solicitud IQ de consulta para obtener detalles del contacto
                const iq = xml('iq', { type: 'get', id: 'contactDetails1' },
                    xml('query', { xmlns: 'jabber:iq:roster' })
                )
                this.xmpp.send(iq)
            }).catch((error) => {
                console.error('Error getting contact details:', error)
            })
        })

        await this.xmpp.stop()
        await this.login()
    }
}

module.exports = {
    User
}