"use strict";
const { parse, HTMLElement } = require("node-html-parser");
const fs = require("fs");
const path = require("path");
const { debuglog } = require("util");
const inputHTML = undefined;
const http = require("http");
const https = require("https");
const { link } = require("fs/promises");

async function getWebResource(url, redirectSet = new Set()) {
  return new Promise((resolve, reject) => {
    let http_obj;
    if (url.match(/^http:.*/i)) {
      http_obj = http;
    } else if (url.match(/^https:.*/i)) {
      http_obj = https;
    } else {
      reject(`Unsupported protocol in ${url}`);
    }
    redirectSet.add(url);
    var data = "";
    http_obj
      .get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", (chunk) => {
            resolve(data);
          });
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          if (res.statusCode === 301) {
            const location = res.headers.location;
            if (typeof location === "string" && !redirectSet.has(location)) {
              getWebResource(location, redirectSet).then((fulfill) =>
                resolve(fulfill)
              );
            }
          } else {
            console.error(
              "Only permanent move 301 is supported with redirect response"
            );
            resolve("");
          }
        } else {
          console.error(`Invalid response from ${url}`);
          resolve("");
        }
      })
      .on("error", (e) => {
        console.error(`Connection to ${url} refused`);
        resolve("");
      });
  });
}

async function appendElementFile(options) {
  const { container, elementFile, tag, attr } = options;
  const elementNode = new HTMLElement(tag, attr ?? {}, "");
  if (elementFile.match(/^http(s?):.*/i)) {
    elementNode.innerHTML = await getWebResource(elementFile);
  } else if (fs.existsSync(elementFile)) {
    elementNode.innerHTML = fs.readFileSync(elementFile).toString();
  } else {
    throw new Error(`File ${elementFile} does not exist`);
  }
  container.appendChild(elementNode);
}

function removeLinkedStyle(options) {
  const { container, source } = options;
  container.removeChild(container.querySelector(`link[href='${source}']`));
}

function removeLinkedScript(options) {
  const { container, source } = options;
  container.removeChild(container.querySelector(`script[src='${source}']`));
}
function removeLinkedRes(options) {
  const { tag, container, link } = options;
  switch (tag) {
    case "style":
      if (typeof link === "string") {
        removeLinkedStyle({ container, link });
      } else if (typeof link == "object") {
        removeLinkedStyle({
          container: link.target ?? container,
          source: link.source,
        });
      }
      break;
    case "script":
      if (typeof link === "string") {
        removeLinkedScript({ container, link });
      } else if (typeof link == "object") {
        removeLinkedScript({
          container: link.target ?? container,
          source: link.source,
        });
      }
      break;
  }
}

async function appendElement(options) {
  const { element, tag, html } = options;
  let container;
  if (typeof(element)==='object' && typeof element.target === "string") {
    container = html.querySelector(element.target);
  } else if (container == undefined) {
    if (tag === "style") {
      container = html.querySelector("head");
    } else if (tag === "script") {
      container = html.querySelector("body");
    } else {
      throw new Error(`Invalid asset type ${tag}, expected style|script`);
    }
  }
  if (typeof element === "string") {
    await appendElementFile({
      container,
      elementFile: element,
      tag,
      attr: element.attr,
    });
  } else if (typeof element === "object") {
    const { path, removeLink } = element;
    if (typeof path === "string") {
      await appendElementFile({
        container,
        elementFile: path,
        tag,
        attr: element.attr,
      });
      if (
        !(
          typeof removeLink === "object" && removeLink[0] != undefined
        )
      ) {
        if (typeof removeLink.target === "string") {
          removeLink.target = html.querySelector(removeLink.target);
        }
        removeLinkedRes({ container, tag, link: removeLink });
      } else {
        removeLink.forEach((remove_el) => {
          if (typeof remove_el.target === "string") {
            remove_el.target = html.querySelector(remove_el.target);
          }
          removeLinkedRes({ container, tag, link: remove_el });
        });
      }
    } else {
      throw new Error(
        `unexpected element path type, expected 'string' but got ${typeof path}, object ${element}`
      );
    }
  }
}
module.exports.combine = async function combine(config) {
  const { input, output, style, script } = config;
  if (typeof input === "string" && typeof output === "string") {
    if (!fs.existsSync(input)) {
      throw new Error(`Input file ${input} not found`);
    }
    const inputHTML = parse(fs.readFileSync(input));
    let html = inputHTML.querySelector("html");
    if (html == undefined) {
      throw new Error("Missing html tag")
    }
    if (!html.querySelector("head")) {
      inputHTML;
      html.insertAdjacentHTML("afterbegin", "<head></head>");
    }
    if (!html.querySelector("body")) {
      html.insertAdjacentHTML("beforeend", "<body></body>");
    }
    if (!(typeof style === "object" && style[0] != undefined)) {
      await appendElement({ element: style, tag: "style", html });
    } else {
      await Promise.all(
        style.map((style_el) => {
          return appendElement({ element: style_el, tag: "style", html });
        })
      );
    }
    if (!(typeof script === "object" && script[0] != undefined)) {
      await appendElement({ element: script, tag: "script", html });
    } else {
      await Promise.all(
        script.map((script_el) => {
          return appendElement({ element: script_el, tag: "script", html });
        })
      );
    }
    fs.writeFileSync(output, inputHTML.toString());
  }
};
