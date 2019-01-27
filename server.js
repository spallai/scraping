var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

//scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

//require all models
var db = require("./models");

var PORT = 3000;

//initialize express
var app = express();

//configure middleware

//use morgan logger for logging requests
app.use(logger("dev"));

//Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//connect to the Mongo DB
mongoose.connect("mongodb://localhost/scraping", { useNewUrlParser: true });

//ROUTES

//A GET for scraping the USA Today website
app.get("/scrape", function (req, res) {
    //First we grab the body of the html with axios
    axios.get("https://www.nytimes.com").then(function (response) {
        //then we load that into cheerio and save it with a $ as the selector
        var $ = cheerio.load(response.data);

        var results = [];

        //we then grab ever title and link as such
        $("article a").each(function (i, element) {
            
            var title = $(element).children().children().text();
            var link = $(element).attr("href");
            var blurb = $(element).find("p").text();
        
            // var title = $(this).find("a").text();
            // var link = $(this).find("a").attr("href");
            results.push({
                title: title,
                link: link,
                blurb: blurb
            });
            console.log(results);
        })
    })
    
})

app.listen(PORT, function(){
    console.log("App is running on Port " + PORT);
})