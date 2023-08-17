const { client, xml } = require("@xmpp/client");
const {print, input, User} = require('./src')

const menu_1 = '\n' + 
    '---------------------------- \n' +
    '1) Administracion de cuentas \n' +
    '2) Manejo de contactos \n' +
    '3) Communicacion \n' +
    's) Salir \n' +
    '>  '

const menu_2 = '\n' + 
    '--------------------------------------------\n' +
    '1) Registrar una nueva cuenta en el servidor\n' +
    '2) Iniciar sesión con una cuenta\n' +
    '3) Cerrar sesión con una cuenta\n' +
    '4) Eliminar la cuenta del servidor\n' +
    's) Salir\n' +
    '> '

const menu_3 = '\n' +
    '--------------------------------------------\n' +
    '1) Mostrar todos los contactos y su estado\n' +
    '2) Agregar un usuario a los contactos\n' +
    '3) Mostrar detalles de contacto de un usuario\n' +
    '4) Definir mensaje de presencia\n' +
    's) Salir\n' +
    '> '

const menu_4 = '\n' +
    '1) Enviar Mensajes Directos\n' +
    '2) Enviar mensaje grupal\n' +
    '3) Enviar archivos\n' +
    's) Salir\n' +
    '> '

// Main
const main = async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    print('---- Bienvenido al cliente CLI de XMPP ----')

    // global variables
    let actual_usr = false

    let option
    while (option !== 's') {
        option = await input(menu_1)

        if (option === 's') {
            continue

        // Admin de cuentas
        } else if (option === '1') {        
            
            let admin_option
            while (admin_option !== 's') {
                admin_option = await input(menu_2)

                if (admin_option === 's'){
                    continue

                // Registrar nueva cuenta
                } else if (admin_option === '1') {
                const username = await input('Ingrese su nombre de usuario: ')
                    const pass = await input('Ingrese su contraseña: ')
                    
                    actual_usr = new User(username, pass)

                    try {
                        await actual_usr.signin()
                        actual_usr = false
                    } catch (error) {
                        print('> Error al registar usuario')
                    }
                    
                // Login
                } else if (admin_option === '2') {
                    const username = await input('Ingrese su nombre de usuario: ')
                    const pass = await input('Ingrese su contraseña: ')

                    if (actual_usr) await actual_usr.xmpp.stop()
                    actual_usr = new User(username, pass)
                
                    try {
                        await actual_usr.login()
                    } catch (error) {
                        print('> Error al hacer login')
                    }

                // Log-out
                } else if (admin_option === '3') {
                    if (!actual_usr) {
                        print('No hay cuentas con login')
                        continue
                    }

                    try {
                        await actual_usr.xmpp.stop()
                        print('>', actual_usr.username, 'desconectado del servidor')
                        actual_usr = false
                    } catch (error) {
                        print('Error al desconectar del servidor')
                    }
                    
                // Eliminar Cuenta
                } else if (admin_option === '4') {

                    try {
                        await actual_usr.deleteAccount()
                        actual_usr = false
                    } catch (error) {
                        print('Error al eliminar cuenta')
                    }
                    
                } else {
                    print('ERROR: Ingrese una opcion valida\n')
                }
            }

        // Admin de contactos
        } else if (option === '2'){
            let comm_option
            while (comm_option !== 's') {
                comm_option = await input(menu_3)

                if (comm_option === 's'){
                    continue

                // Ver listado de contactos
                } else if (comm_option === '1') {
                    if (!actual_usr) {
                        print('> No hay usuario con login')
                        continue
                    }
                    
                    await actual_usr.getContactList()
                
                // Enviar solicitud de contacto
                } else if (comm_option === '2') {
                    if (!actual_usr) {
                        print('> No hay usuario con login')
                        continue
                    }
                    
                    const new_friend = await input('Ingrese el nuevo contacto: ')

                    try {
                        actual_usr.friendRequest(new_friend)
                    } catch(e) {
                        print('> ERROR al agregar contacto, intente de nuevo\n')
                    }
                    
                // Mostrar detalles de un contacto
                } else if (comm_option === '3') {
                    const contact = await input('Ingrese un contacto: ')
                    await actual_usr.getContact_info(contact)
                
                // Definir mensaje de presencia
                } else if (comm_option === '4') {
                    if (!actual_usr) {
                        print('> No hay usuario con login')
                        continue
                    }
                    
                    const new_presence = await input('Ingrese la nueva presencia: ')

                    try {
                        actual_usr.change_presence(new_presence)
                    } catch (error) {
                        print('> Error al cambiar preencia')
                    }

                } else {
                    print('ERROR: Ingrese una opcion valida\n')
                }
            }

        // Comunicacion
        } else if (option === '3'){

            let comm_option
            while (comm_option !== 's') {
                comm_option = await input(menu_4)

                if (comm_option === 's'){
                    continue

                // DM's
                } else if (comm_option === '1') {
                    if (!actual_usr) {
                        print('> No hay usuario con login')
                        continue
                    }

                    await actual_usr.getContactList(false)
                    const contact_list = actual_usr.contacts.reduce((acc, val) => {
                        return acc +
                            `${(actual_usr.contacts.indexOf(val) + 1).toString()}) ${val}\n` 
                    }, '')

                    const destin = actual_usr.contacts[
                        parseInt(await input(
                            'Seleccione usuario destino\n' +
                            contact_list + '> '
                        )) - 1
                    ]

                    const msg = await input('ingrese un mensjae: ')
                    await actual_usr.send_dm(destin, msg)

                // Participar en conversaciones grupales
                } else if (comm_option === '2') {
                    print('opcion:', comm_option)
                    
                // Enviar archivos
                } else if (comm_option === '3') {
                    if (!actual_usr) {
                        print('> No hay usuario con login')
                        continue
                    }

                    await actual_usr.getContactList(false)
                    const contact_list = actual_usr.contacts.reduce((acc, val) => {
                        return acc +
                            `${(actual_usr.contacts.indexOf(val) + 1).toString()}) ${val}\n` 
                    }, '')

                    const destin = actual_usr.contacts[
                        parseInt(await input(
                            'Seleccione usuario destino\n' +
                            contact_list + '> '
                        )) - 1
                    ]

                    const msg = await input('ingrese un mensjae: ')
                    const filepath = await input('Ingrese path del archivo: ')

                    actual_usr.send_file(destin, msg, filepath)

                } else {
                    print('ERROR: Ingrese una opcion valida\n')
                }
            }
        } else {
            print('ERROR: Ingrese una opcion valida\n')
        }
    }

    if (actual_usr) {
        print('> Desconectando del servidor')
        await actual_usr.xmpp.stop()
    }

    print('\nGracias por usar el cleinte XMPP!!')
}

main()
