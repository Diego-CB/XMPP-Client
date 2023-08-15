
const print = (...o) => {
    const str = o.reduce(
        (acc, val) => acc.toString() + ' ' + val.toString(),
        ''
    )
    console.log(str)
}

// input async function
const input = async (msg) => {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise((resolve, reject) => {
        readline.question(msg, usr_input => {
            resolve(usr_input);
            readline.close();
        });
    });
}

module.exports = {
    input,
    print
}
