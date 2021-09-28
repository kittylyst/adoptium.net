const {
  newsItems 
} = require("../json/config");

// When page loads, run:
module.exports.load = () => {
  const template = Handlebars.compile(document.getElementById("template").innerHTML);
  document.getElementById("newsItems").innerHTML = template({newsItems});
}

