const express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground  = require("./models/campgrounds"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    Admin       = require("./models/AdminUser")
    seedDB      = require("./seeds");
var fileUpload = require('./lib/index');

var http = require('http').Server(app);
var io = require('socket.io')(http);

const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
var outputPath;
const forceSync = require('sync-rpc');
const syncFunction = forceSync(require.resolve('./routes/searchmaricopa'));

const keys = require('./config/keys');
const stripe = require('stripe')(keys.stripeSecretKey)
    
//requiring routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");

mongoose.connect("mongodb://localhost/database");
mongoose.Promise = require('bluebird');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// seedDB(); //seed the database
//Initial user
User.findOneAndRemove({ username: 'DaveRolf2019' }, function(err) {
  console.log(err);
});

/* const newuser = new Admin();
   newuser.firstname = "Dave";
   newuser.lastname = "Rolf";
   newuser.companyname="TagProcess Service";
   newuser.email = "DaveRolf@gmail.com";
   newuser.phonenumber = "123456789";
   newuser.username = "DaveRolf2019"
   newuser.password = newuser.encryptPassword("123qweasdzxc");
  // Create a new campground and save to DB

  Admin.create(newuser, function(err, newlyCreated){
    if(err){
      console.log(err);
    } else {      
    }
}); */

//socket 
var users ={}
io.on('connection', function(socket){
  setInterval(function(){ io.emit('init',users);
  }, 2000);
  

  socket.on('login', function(data){
    console.log('a user' + data.userId + ' connected');
    //saving userId to array with socket ID
    users[socket.id] = data.userId;
    io.emit('login', data.userId);
    
  });
  socket.on('disconnect', function(){
    console.log('user ' + users[socket.id] + ' disconnected');
    io.emit('logout', users[socket.id]);
    delete users[socket.id];
  });
 
});


// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/adminpanel", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);


/* app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started!");
   console.log(process.env.PORT)
   
}); */

// default options;
app.get("/",function(req,res){
  res.render("campgrounds/index",{campgrounds:null,noMatch: null,allhistory:null});

})
app.use(fileUpload());
app.post('/upload', function(req, res) {
  let sampleFile;
  let uploadPath;

  if (Object.keys(req.files).length == 0) {
    var noMatch = "No File Uploaded!"
    res.render("campgrounds/index",{campgrounds:null,noMatch:noMatch  }) 
    return;
  }

  console.log('req.files >>>', req.files); // eslint-disable-line
  console.log("minetype=>"+ req.files.sampleFile.mimetype);
    if(req.files.sampleFile.mimetype == 'application/vnd.ms-excel') {
    sampleFile = req.files.sampleFile;
    //console.log("DateType=>"+typeof(Date.now()));

    //console.log("Date=>"+Date.now());

    uploadPath = __dirname + '/uploads/' + Date.now()+sampleFile.name;
     console.log(" => "+uploadPath);
    sampleFile.mv(uploadPath, function(err) {
      if (err) {
        return res.status(500).send(err);
      }
     
      
    });
    /** csv file
a,b,c
1,2,3
4,5,6
*/
  const csvFilePath = uploadPath;
  outputPath = __dirname + '/uploads/'+ Date.now()+'output.csv';
  const output = []; // holds all rows of data
  //csv()
  //.fromFile(csvFilePath)
  //.then((jsonObj)=>{

      //console.log(jsonObj);
      /**
       * [
       * 	{a:"1", b:"2", c:"3"},
       * 	{a:"4", b:"5". c:"6"}
       * ]
       */ 
      var inputbuff = []
     fs.createReadStream(csvFilePath) 
     .pipe(csv())
     .on('data', (data) => inputbuff.push(data))
     .on('headers', (headers) => {
      console.log(`First header: ${headers[0]}`)
    })
     .on('end', () => {

      var result = [];
      var searchquery=[];
      var searchzip = [];
      var regex =[];
      var searchData=[];
      var noMatch = null;
      for (var i in inputbuff) {
        //console.log("JSON => "+JSON.stringify(inputbuff[i]));
        result[i] = JSON.stringify(Object.values(inputbuff[i])[0]);
        //console.log("JSON => "+result[i]);
        searchquery[i] = result[i].slice(result[i].length-6,result[i].length-1).trim();
        searchzip[i]= parseInt(searchquery[i]);      
        
        if (searchzip[i] > 80000 && searchzip[i] < 81659) {
          regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
      }  else {     
        //regex[i] = 
       const syncReturn = syncFunction(result[i]);
        regex[i] =new RegExp(escapeRegex(syncReturn), 'gi');;
        //console.log("sycnReturn =>"+ syncReturn);
       // console.log("regex =>"+i+"=>" +regex[i]);
        searchquery[i] = syncReturn;
                   
    }
      }
      Campground.find({zipcodes: regex}, function(err, allCampgrounds){
        if(err){
                console.log(err);
        } else {
            
                if(allCampgrounds.length < 1) {
                    noMatch = "No courts match that query, please try again.";
                } else{
                
                //console.log("alllcamp=>"+ allCampgrounds);
                for (var i = 0; i< result.length; i ++) {
                    for (var j = 0; j< allCampgrounds.length; j ++) {
                        //console.log("allcamp => "+ allCampgrounds);
                        //console.log("allcamp[j] => "+ allCampgrounds[j]);
                        var temp= {};
                        if(allCampgrounds[j].zipcodes.includes(searchquery[i])){
                          
                            temp.num = i + 1 ;
                            if (i == result.length - 1 ) temp.search = result[i];
                            else {temp.search = result[i];}
                            temp.districtNum =allCampgrounds[j].judicalDistrictNum;
                            temp.courtName = allCampgrounds[j].courtName + " Court";
                            temp.address = allCampgrounds[j].address;
                            temp.phone = allCampgrounds[j].phone;
                            searchData.push(temp); break;
                        } else {
                            if (j == allCampgrounds.length - 1) {
                            temp.num = i + 1;
                            if (i == result.length - 1 ) temp.search = result[i];
                            else {temp.search = result[i];}
                            temp.districtNum =null;
                            temp.courtName = null;
                            temp.address = "";
                            temp.phone = null;
                            searchData.push(temp);
                            }
                        }
                    }   
                }
                //console.log("Search Data =>"+searchData);
                
            } 
            //res.render("campgrounds/index",{campgrounds:searchData,noMatch: noMatch});  
            console.log("search => "+ JSON.stringify(searchData))
        }
        
        var header =["Input Address","Distric Number", "Court Name","Court Address","Phone Number"];
        output.push(header.join());
        searchData.forEach((d) => {
          const row = []; // a new array for each row of data
          
          row.push(d.search);
          row.push(d.districtNum);
          row.push(d.courtName);
          row.push(`"${d.address}"`);
          row.push(d.phone);
          output.push(row.join());
          //console.log("row =>" +row); // by default, join() uses a ','
          fs.writeFileSync(outputPath, output.join(os.EOL)); 
        });
        console.log("outputpath=>"+output);
        noMatch = "Upload completed";
        req.flash("success", "Upload Completed! You can download now");
        res.render("campgrounds/index",{campgrounds:null,noMatch:noMatch,allhistory:null  }) 
        if(req.user) {
          User.findOne({username:req.user.username}, function(err, user){
              if(err){
                  console.log(err);
                  res.redirect("/campgrounds");
              } else {
                  searchData.forEach((data,index) => {
                      Comment.create(data, function(err, comment){
                          if(err){
                              
                              console.log(err);
                          } else {
                              //add username and id to comment
                             
                              comment.username = req.user.username;
                              comment.search = data.search;
                              comment.courtName = data.courtName;
                              comment.address = data.address;
                              comment.phone = data.phone;
                              //save comment
                              comment.save();
                              
                          }
                       });
                  });
              }
          });
     
  }
       
    });   
      //console.log("regex => "+ regex)
      //console.log("JSON Length= "+jsonObj.length);
      //var myJSON = JSON.stringify(jsonObj[1]. Address);
     
      //res.render("campgrounds/index",{campgrounds:null,noMatch:myJSON });
  })
 
// Async / await usage
//const jsonArray=await csv().fromFile(csvFilePath);
    } else {
      var noMatch = 'Sorry, File uploaded failed: Try to upload csv file ';
      res.render("campgrounds/index",{campgrounds:null,noMatch: noMatch}); 
    }
 });
 app.post('/download', function(req, res){
  if(outputPath !==undefined) {
  res.download(outputPath);
} else{  res.render("campgrounds/index",{campgrounds:null,noMatch:"You didn't upload address file!" }) 
}
});
/* stripe.products.create({
  name: 'Monthlymembership',
  type: 'service',
}, function(err, product) {
  console.log(JSON.stringify(product.id));
}); */
/* stripe.plans.create({
    
  amount: 499,
  nickname :"monthlymember",
  interval: "month",
  product: "prod_EhmDEDQNzYXrp1",
  currency: "usd",
}, function(err, plan) {
  // asynchronously called
  console.log(JSON.stringify(plan.id));
}); */
app.post('/charge/:id',(req,res) =>{
  
  
  stripe.customers.create({
    email:req.body.stripeEmail,
    source : req.body.stripeToken
  })
  .then(customer => stripe.subscriptions.create({
    customer :customer.id,
    items :[{
      plan:"plan_EhmFZfOrbwBWKV",
    },]
    
  }, function(err,subscription){
    User.findOneAndUpdate({ username: req.params.id }, { $set: { email: req.body.stripeEmail,customerid:customer.id,subscription:true}}, { new: true }, function(err, doc) {
     
        if (err) {
            console.log("Something wrong when updating data!");
        }
        console.log(doc);
    });
    req.flash("success", req.params.id+", Your subscription was set correctly");
    res.redirect("/campgrounds");

    //res.render("campgrounds/index",{campgrounds:null,noMatch:"Thank you for your payment." });
   
  })
    
    /* stripe.charges.create({
    amount,
    description :'Tag Process Service Court Locator',
    currency : 'usd',
    customer: customer.id
  } )*/
  )
  //.then(subscription => res.render("campgrounds/index",{campgrounds:null,noMatch:"Thank you for your payment." }));

});
app.post('/downgrade',(req,res) =>{
  User.findOne({ username: req.user.username }, function (err, adventure) {
    stripe.subscriptions.del({
      customer :adventure.customerid,
      items :[{
        plan:"plan_EhmFZfOrbwBWKV",
      },]
      
    }, function(err,subscription){
      User.findOneAndUpdate({ username: req.params.id }, { $set: { subscription:false}}, { new: true }, function(err, doc) {
       
          if (err) {
              console.log("Something wrong when updating data!");
          }
          console.log(doc);
      });
      req.flash("success", req.params.id+", Your subscription was canceled correctly");
      res.redirect("/campgrounds");
  
      //res.render("campgrounds/index",{campgrounds:null,noMatch:"Thank you for your payment." });
     
    })
  });  
  //.then(subscription => res.render("campgrounds/index",{campgrounds:null,noMatch:"Thank you for your payment." }));

})
app.get('/charge',(req,res)=>{
  res.redirect("/login")
})
app.get('/downgrade/',(req,res)=>{
  res.redirect("/login")
})

app.get('/history',(req,res) =>{
  console.log(req);
  Comment.find({username:req.user.username}, function(err, allhistory){
    if(err){
      console.log(err);
    }
    res.render("campgrounds/index",{campgrounds:null,noMatch: null,allhistory:allhistory});
  })
  //.then(subscription => res.render("campgrounds/index",{campgrounds:null,noMatch:"Thank you for your payment." }));

});
app.set('port', (process.env.PORT || 5000));


http.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});


function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

