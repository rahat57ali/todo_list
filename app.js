//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

MONGODB_CONNECT_URI="mongodb+srv://admin-rahat:test123@cluster0.ovjbqwa.mongodb.net/todolistDB";

mongoose.connect(process.env.MONGODB_CONNECT_URI, { useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));




 const itemsSchema = new mongoose.Schema({
  name: String
 });

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list."
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("list", listSchema);


app.get("/", function(req, res) {
  (async()=>{
    try{
      const items = await Item.find();
      if(items.length === 0){
        Item.insertMany(defaultItems).then(function(){
          console.log("Data inserted")
        }).catch(function(err){
          console.log(err);
        });
        res.redirect('/');
      } else{
        res.render("list", {listTitle: "Today", newListItems: items});
      }
    } catch(err){
      console.log(err);
    }
  })()
  
});

app.get("/:customListName", function(req, res){
  
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then((docs)=>{
      if(!docs){
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        // Show an existing list
        res.render("list", {listTitle: docs.name, newListItems: docs.items});
      }
      
    })
    .catch((err)=>{
      console.log(err);
    });
  // console.log(found);
  
  



});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
      .then((foundList)=>{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
      })
  }

  
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today"){
    (async() => {
      await Item.findByIdAndDelete(checkedItemId);
    })()
  
    res.redirect("/")
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}})
      .then((foundList)=>{
        res.redirect("/"+listName);
      })
  }
  
});

app.get("/about", function(req, res){
  res.render("about");
});

PORT = 3000

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});