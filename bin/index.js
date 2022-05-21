#!/usr/bin/env node
const {combine} = require('../lib/index.js')
const fs = require('fs')

function parseOptions() {
  let args = process.argv.slice(2)
  let obj = {}
  args.forEach(val => {
    let opt_match = val.match(/--(.*)/)
    if (opt_match) {
      let option = opt_match[1]
      let parse_match = option.match(/(\w+)(=[\w\.]+)?/)
      if (parse_match[2]) {
        obj[parse_match[1]] = parse_match[2].slice(1)
      } else {
        obj[parse_match[1]] = true
      }
    }
  })
  return obj
}

let obj = parseOptions()
if (typeof(obj.config) === 'string') {
  if (fs.existsSync(obj.config)) {
    const jsonObj = JSON.parse(fs.readFileSync(obj.config))
    combine(jsonObj).then(() => {
      console.log("done.")
      const {input} = jsonObj;
      if (obj.watch) {
        fs.watchFile(input, function changeListener(current, prev) {
          combine(jsonObj).then(() => {
            console.log("done.")
          }).catch(err => {
            console.log(err.message)
            process.exit(1)
          })
        })
      }

    }).catch(err => {
      console.log(err.message)
      throw err
      process.exit(1)
    });
    
    
  } else {
    console.error(`Config file ${obj.config} not found`)
    process.exit(1)
  }
  
  
} else {
  console.log(`
  Usage:
    ${process.argv[0]} ${process.argv[1]} [options]

    options:
      --config=<file_name>        Specify path of configuration file (json format)
      --watch                     Watch changes in input file specified in config object
  `)
  process.exit(0)
}


