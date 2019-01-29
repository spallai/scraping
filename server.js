var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

//scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nytimes";

mongoose.connect(MONGODB_URI);

var PORT = 3000;

//initialize express
var app = express();

//require all models
var db = require("./models");
//configure middleware

//use morgan logger for logging requests
app.use(logger("dev"));

//Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

// //connect to the Mongo DB
// mongoose.connect("mongodb://localhost/nytimes", { useNewUrlParser: true });

//ROUTES

//A GET for scraping the USA Today website
app.get("/scrape", function (req, res) {
    //First we grab the body of the html with axios
    axios.get("https://www.nytimes.com").then(function (response) {
        //then we load that into cheerio and save it with a $ as the selector
        var $ = cheerio.load(response.data);

        var result = {};

        //we then grab ever title and link as such
        $("article a").each(function (i, element) {
            var scrapedLink = $(this).attr("href");

            if(!scrapedLink.startsWith("https://www.nytimes.com")) {
                scrapedLink = "https://www.nytimes.com" + scrapedLink;
            }

            result.title = $(this).children().children().text();
            result.link = $(this).attr("href");
            result.blurb = $(this).find("p").text();
        
            // var title = $(this).find("a").text();
            // var link = $(this).find("a").attr("href");
            
            db.Article.create(result).then(function(data){
                console.log(data);
            }).catch(function(err){
                console.log(err);
            });
        });
        res.send("Scrape complete");
    });
    
})

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
app.listen(PORT, function(){
    console.log("App is running on Port " + PORT);
})