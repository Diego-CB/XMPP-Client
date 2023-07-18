// Code based on Hussein Nasser project: https://www.youtube.com/watch?v=OVN99SgBGkM

const xmpp = require('simple-xmpp')
const server_str = '@alumchat.xyz'

xmpp.on('online', data => {
  console.log('Online')
  console.log(`Connected as ${data.jid.user}`)
  send()
})

xmpp.connect({
  'jid': 'diegocordova@alumchat.xyz',
  'password': 'password',
  'host': 'localhost',
  'port': 5022,
})

xmpp.on('error', error => {
  console.log('Something went wrong', error)
})

xmpp.on('chat', (from, message) => {
  console.log('Got message:', message, 'from', from)
})

// Send message
xmpp.send()

/**
 * Sends message every 5 seconds
 */
const send = () => {
  setTimeout(send, 5000)
  xmpp.send('botalgo' + server_str, 'Hi bot!!')
}