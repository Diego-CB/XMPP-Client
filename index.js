const { client, xml } = require("@xmpp/client");
const {print, input, User} = require('./src')

const menu_1 = '\n' + 
    '---------------------------- \n' +
    '1) Administracion de cuentas \n' +
    '2) Communicacion \n' +
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
    '4) Comunicación 1 a 1 con cualquier usuario/contacto\n' +
    '5) Participar en conversaciones grupales\n' +
    '6) Definir mensaje de presencia\n' +
    '7) Enviar/recibir notificaciones\n' +
    '8) Enviar/recibir archivos\n' +
    's) Salir\n' +
    '> '

// Main
const main = async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    print('---- Bienvenido al cliente CLI de XMPP ----')

    // global variables
    let actual_usr

    let option
    while (option !== 's') {
        option = await input(menu_1)

        if (option === 's') {
            continue

        } else if (option === '1') {        
            
            let admin_option
            while (admin_option !== 's') {
                admin_option = await input(menu_2)

                if (admin_option === 's'){
                    continue

                } else if (admin_option === '1') {
                    print('opcion:', admin_option)
                    const username = await input('Ingrese su nombre de usuario: ')
                    const pass = await input('Ingrese su contraseña: ')
                    actual_usr = new User(username, pass)
                    actual_usr.signin()
                    console.log('>', username, ' creado y online')

                } else if (admin_option === '2') {
                    print('opcion:', admin_option)
                    const username = await input('Ingrese su nombre de usuario: ')
                    const pass = await input('Ingrese su contraseña: ')
                    actual_usr = new User(username, pass)
                    actual_usr.login()
                    console.log('>', username, 'online')
                    
                } else if (admin_option === '3') {
                    if (actual_usr instanceof User) {
                        actual_usr.xmpp.stop()
                        print('>', actual_usr.username, 'desconectado del servidor')
                    } else {
                        print('No hay cuentas con login')
                    }
                    
                } else if (admin_option === '4') {
                    print('opcion:', admin_option)
                    
                } else {
                    print('ERROR: Ingrese una opcion valida\n')
                }
            }

        } else if (option === '2'){
            let comm_option
            while (comm_option !== 's') {
                comm_option = await input(menu_3)

                if (comm_option === 's'){
                    continue

                } else if (comm_option === '1') {
                    print('opcion:', comm_option)
                    
                } else if (comm_option === '2') {
                    print('opcion:', comm_option)
                    
                } else if (comm_option === '3') {
                    print('opcion:', comm_option)
                    
                } else if (comm_option === '4') {
                    print('opcion:', comm_option)

                } else if (comm_option === '5') {
                    print('opcion:', comm_option)

                } else if (comm_option === '6') {
                    print('opcion:', comm_option)

                } else if (comm_option === '7') {
                    print('opcion:', comm_option)

                } else if (comm_option === '8') {
                    print('opcion:', comm_option)

                } else {
                    print('ERROR: Ingrese una opcion valida\n')
                }
            }

        } else {
            print('ERROR: Ingrese una opcion valida\n')
        }
    }

    print('Gracias por usar el cleinte XMPP!!')
}

main()
