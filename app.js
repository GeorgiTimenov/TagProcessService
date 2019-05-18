const express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground  = require("./models/campgrounds"),
     Newmexico = require("./models/NewMexico"),
     Nevada = require("./models/Nevada"),
     maricopa = require("./models/maricopa"),
     pinal = require("./models/pinal"),
     Arizona_zip = require("./models/Arizona_zip")
const Az_county = require("./models/Az_county");
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    Admin       = require("./models/AdminUser")
    seedDB      = require("./seeds");
var fileUpload = require('./lib/index');
const fetch = require('node-fetch');
  axios = require('axios');
var http = require('http').Server(app);
var io = require('socket.io')(http);

const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
var outputPath;
//const syncFunction = forceSync(require.resolve('./routes/searchmaricopa'));

const keys = require('./config/keys');
const stripe = require('stripe')(keys.stripeSecretKey)
 
//requiring routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");
const { searchmaricopa } = require("./routes/searchmaricopa");
const { searchpinal } = require("./routes/searchpinal");

mongoose.connect("mongodb://localhost/database");


/* var dbURI='mongodb+srv://root:root@gettingstarted-7udkw.mongodb.net/test?retryWrites=true';
mongoose.connect(dbURI,function(err){    
    if(err){ 
    console.log('Some problem with the connection ' +err)   
    } 
    else {
    console.log('The Mongoose connection is ready')  
    }

}) */
mongoose.Promise = require('bluebird');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use( bodyParser.json());
app.use(flash());
// seedDB(); //seed the database
//Initial user
User.findOneAndRemove({ username: 'DaveRolf2019' }, function(err) {
  console.log(err);
});

const Cat = mongoose.model('Cat', { name :String});

app.get('/addKitty', function(req,res) {
  const kitty = new Cat({ name :'Dragonskin2018'});
  kitty.save().then(() => console.log('mom'));
  res.send(kitty);
});

app.get('/getKitties', async function(req,res) {
	
	try {
		var cats = await Cat.find().then(() => res.send(cats))
		
	} catch(error){
		console.log(error);
		res.send({error: error.message});
	}
	
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
app.use("/search", campgroundRoutes);
app.use("/adminpanel", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);


/* app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started!");
   console.log(process.env.PORT)
   
}); */

// default options;

app.use(fileUpload());
app.post('/upload', async function(req, res) {
  
  console.log(req.query.username);
  console.log(req.query.accessid);
  var username = req.query.username;
  var accessid = req.query.accessid;
  let sampleFile;
  let uploadPath;
  let path = "";
  if (Object.keys(req.files).length == 0) {
    req.flash("success", "You didn't upload file");
    res.render("campgrounds/index",{campgrounds:null,allhistory:null}) 
    return;
  }

  console.log('req.files >>>', req.files); // eslint-disable-line
  console.log("minetype=>"+ req.files.sampleFile.mimetype);
    if(req.files.sampleFile.mimetype == 'application/vnd.ms-excel') {
    sampleFile = req.files.sampleFile;
    console.log("DateType=>"+typeof(Date.now()));

    path = makeid(10);
    console.log("Date=>"+Date.now());

    uploadPath = __dirname + '/uploads/' + path +sampleFile.name;
     console.log(" => "+uploadPath);
  await  sampleFile.mv(uploadPath, function(err) {
      if (err) {
        res.redirect("/search");
        return res.status(500).send(err);

      }
      
    });
    /** csv file
a,b,c
1,2,3
4,5,6
*/
  const csvFilePath = uploadPath;
 
  const output = []; // holds all rows of data
 // csv()
  //.fromFile(csvFilePath)
  //.then((jsonObj)=>{

     // console.log(jsonObj);
      /**
       * [
       * 	{a:"1", b:"2", c:"3"},
       * 	{a:"4", b:"5". c:"6"}
       * ]
       */ 
      var inputbuff = [];
    await fs.createReadStream(csvFilePath) 
     .pipe(csv(['filenum', 'address','city','state','zipcode']))
     .on('data', (data) => inputbuff.push(data))
     .on('headers', (headers) => {
      console.log(`First header: ${headers[0]}`)
    })
     .on('end', () => {

      var result = [];
      var fileNum =[];
      var searchquery=[];
      var searchzip = [];
      var regex =[];
      var searchData=[];
      var conditionlength;

      (async ( ) => {
        var i;
      for ( i in inputbuff) {

        console.log("JSON => "+JSON.stringify(inputbuff[i]));
        fileNum[i] = JSON.stringify(Object.values(inputbuff[i])[0]);
        console.log("Length=>" + Object.keys(inputbuff[i]).length);
         conditionlength = Object.keys(inputbuff[i]).length;
        if (conditionlength === 2) {
          result[i] = JSON.stringify(Object.values(inputbuff[i])[1]);
          console.log("JSON => "+result[i]);
          searchquery[i] = result[i].slice(result[i].length-6,result[i].length-1).trim();
        } else {
          result[i] = Object.values(inputbuff[i])[1]+','+Object.values(inputbuff[i])[2]+',' + 
            Object.values(inputbuff[i])[3] + ' ' + Object.values(inputbuff[i])[4];
            searchquery[i] = result[i].slice(result[i].length-6,result[i].length).trim();
        }
       
        
        searchzip[i]= parseInt(searchquery[i]);      
                  
       

            if ((searchzip[i] > 80000 && searchzip[i] < 81659)) {   //Colorado 
              regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
              console.log(regex[i]+" "+i);
              if((accessid.includes("d") ==false)&&(accessid.includes("D") ==false)) {
                var temp ={};
                        var errortext = `Your court information could not be found. You do not have access to this area. Contact us, if you would like to add this area to your subscription.` ;
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 0;
                                              temp.courtName = errortext;
                                              temp.address = " ";
                                              temp.phone = null;
                                              temp.filingFee = null;
                                              temp.courtType = null;
                                              searchData.push(temp);     
              } else {
              await Campground.findOne({zipcodes:regex[i]}, function(err, allCampgrounds){
                if(err){
                        console.log(err);
                } else {
                                      // console.log("regex[]=>"+ regex);
                                      if (allCampgrounds!=null) {
                                    var temp ={};
                                    temp.search = result[i];
                                    temp.fileNum = fileNum[i];
                                    temp.num = 0 ;
                                    temp.districtNum =allCampgrounds.judicalDistrictNum;
                                    if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                                      temp.courtName = allCampgrounds.courtName
                                    } else {
                                      temp.courtName = allCampgrounds.courtName + " Court";
                                    }
                                    temp.address = allCampgrounds.address;
                                    temp.phone = allCampgrounds.phone;
                                    temp.filingFee = allCampgrounds.filingFee;
                                    temp.courtType = allCampgrounds.courtType;
                                    searchData.push(temp); 
                       // console.log("Search Data =>"+JSON.stringify(searchData));
                      } else {
                        var temp ={};
                        var errortext = `Your court information could not be found. 1. Please verify your input address is a valid address. 2. The address might be located outside of our developed states. Please refer to our home page for a current development map.` ;
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 0;
                                              temp.courtName = errortext;
                                              temp.address = " ";
                                              temp.phone = null;
                                              temp.filingFee = null;
                                              temp.courtType = null;
                                              searchData.push(temp);
                                              
                      }
                        
                    } 
              }) 
            }
            } else if ((searchzip[i] >= 85117 && searchzip[i] <= 85194)||(searchzip[i] == 85618 || searchzip[i] == 85623 || searchzip[i] ==85631) ) {  //Pinal
              var fetchstring = 'https://maps.googleapis.com/maps/api/geocode/json?address='+result[i]+'&key=AIzaSyA1T95uAq72g2rFXa1hhyJD3De1NdE6OxI';      
              regex[i] = await getquerypinal(fetchstring);
              if((accessid.includes("a") ==false)&&(accessid.includes("A") ==false)) {
                var temp ={};
                        var errortext = `Your court information could not be found. You do not have access to this area. Contact us, if you would like to add this area to your subscription.` ;
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 0;
                                              temp.courtName = errortext;
                                              temp.address = " ";
                                              temp.phone = null;
                                              temp.filingFee = null;
                                              temp.courtType = null;
                                              searchData.push(temp);     
              } else {
               await pinal.findOne({courtName:regex[i]}, function(err, allCampgrounds){
                if(err){
                        console.log(err);
                } else {

                  console.log("regex[]=>"+ regex[i]);
                  if(allCampgrounds == null) {
                    var temp ={};
                    var errortext = `Your court information could not be found. 1. Please verify your input address is a valid address. 2. The address might be located outside of our developed states. Please refer to our home page for a current development map.` ;
                                          temp.search = result[i];
                                          temp.fileNum = fileNum[i];
                                          temp.num = 1;
                                          temp.courtName = errortext;
                                          temp.address = " ";
                                          temp.phone = null;
                                          temp.filingFee = null;
                                          temp.courtType = null;
                                          searchData.push(temp); 
                  } else {
                  var temp ={};
                  temp.search = result[i];
                  temp.fileNum = fileNum[i];
                  temp.num = 2;
                  temp.districtNum =allCampgrounds.judicalDistrictNum;
                  if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                    temp.courtName = allCampgrounds.courtName
                  } else {
                    temp.courtName = allCampgrounds.courtName + " Court";
                  }
                  temp.address = allCampgrounds.address;
                  temp.phone = allCampgrounds.phone;
                  temp.courtType = allCampgrounds.courtType;
                  temp.filingFee = allCampgrounds.filingFee;
                  searchData.push(temp);

                 // console.log("Search Data =>"+JSON.stringify(searchData));                        
                } 
              }
              })
                console.log(regex[i]+" "+i);
        
              await  Az_county.findOne({countyname:"Pinal County"}, function(err, allCampgrounds){////////
                  if(err){
                          console.log(err);
                  } else {
                      if (allCampgrounds==null) {
                        var error = "error";
                        console.log("here?");
                      } else {
                        
                        // console.log("regex[]=>"+ regex);
                        var temp ={};
                        temp.search = result[i];
                        temp.fileNum = fileNum[i];
                        temp.num = 1;
                        temp.districtNum =allCampgrounds.judicalDistrictNum;
                        if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                          temp.courtName = allCampgrounds.courtName
                        } else {
                          temp.courtName = allCampgrounds.courtName + " Court";
                        }
                        temp.address = allCampgrounds.address;
                        temp.phone = allCampgrounds.phone;
                        temp.filingFee = allCampgrounds.filingFee;
                        temp.courtType = allCampgrounds.courtType;
                        searchData.push(temp); 
                         // console.log("Search Data =>"+JSON.stringify(searchData));
                          
                      }
                      } 
                      
                        
              });
                     
            }
            }
            else if ((searchzip[i] >= 85001 && searchzip[i] <= 85087)||(searchzip[i] >= 85201 && searchzip[i] <= 85390)) {     
              var fetchstring = 'https://maps.googleapis.com/maps/api/geocode/json?address='+result[i]+'&key=AIzaSyA1T95uAq72g2rFXa1hhyJD3De1NdE6OxI';      
              regex[i] = await getquery(fetchstring);

              if((accessid.includes("a") ==false)&&(accessid.includes("A") ==false)) {
                var temp ={};
                        var errortext = `Your court information could not be found. You do not have access to this area. Contact us, if you would like to add this area to your subscription.` ;
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 0;
                                              temp.courtName = errortext;
                                              temp.address = " ";
                                              temp.phone = null;
                                              temp.filingFee = null;
                                              temp.courtType = null;
                                              searchData.push(temp);     
              } else {

               await maricopa.findOne({courtName:regex[i]}, function(err, allCampgrounds){
                if(err){
                        console.log(err);
                } else {

                  // console.log("regex[]=>"+ regex);
                  if( allCampgrounds ==null) {
                    var temp ={};
                    var errortext = `Your court information could not be found. 1. Please verify your input address is a valid address. 2. The address might be located outside of our developed states. Please refer to our home page for a current development map.` ;
                                          temp.search = result[i];
                                          temp.fileNum = fileNum[i];
                                          temp.num = 2;
                                          temp.courtName = errortext;
                                          temp.address = " ";
                                          temp.phone = null;
                                          temp.filingFee = null;
                                          temp.courtType = null;
                                          searchData.push(temp); 
                  } else {
                  var temp ={};
                  temp.search = result[i];
                  temp.fileNum = fileNum[i];
                  temp.num = 2;
                  temp.districtNum =allCampgrounds.judicalDistrictNum;
                  if ( allCampgrounds.courtName.includes("court") ) {
                    temp.courtName = allCampgrounds.courtName
                  } else {
                    temp.courtName = allCampgrounds.courtName + " Court";
                  }
                  
                  temp.address = allCampgrounds.address;
                  temp.phone = allCampgrounds.phone;
                  temp.courtType = allCampgrounds.courtType;
                  temp.filingFee = allCampgrounds.filingFee;
                  searchData.push(temp);

                 // console.log("Search Data =>"+JSON.stringify(searchData));                        
                } 
              } 
              })
                console.log(regex[i]+" "+i);
                    await  Az_county.findOne({countyname:"Maricopa County"}, function(err, allCampgrounds){
                      if(err){
                              console.log(err);
                      } else {
                          if (allCampgrounds==null) {
                            var error = "error";
                            console.log("here?");
                          } else {
                            
                            // console.log("regex[]=>"+ regex);
                            var temp ={};
                            temp.search = result[i];
                            temp.fileNum = fileNum[i];
                            temp.num = 1;
                            temp.districtNum =allCampgrounds.judicalDistrictNum;
                            if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                              temp.courtName = allCampgrounds.courtName
                            } else {
                              temp.courtName = allCampgrounds.courtName + " Court";
                            }
                            temp.address = allCampgrounds.address;
                            temp.phone = allCampgrounds.phone;
                            temp.filingFee = allCampgrounds.filingFee;
                            temp.courtType = allCampgrounds.courtType;
                            searchData.push(temp); 
                            //  console.log("Search Data =>"+JSON.stringify(searchData));
                              
                          }
                          } 
                        });
               
                  }
            } else if (searchzip[i] >= 87001 && searchzip[i] <= 88439) {
             
              regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
              console.log("cities"+ regex[i]);
              if((accessid.includes("b") ==false)&&(accessid.includes("B") ==false)) {
                var temp ={};
                        var errortext = `Your court information could not be found. You do not have access to this area. Contact us, if you would like to add this area to your subscription.` ;
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 0;
                                              temp.courtName = errortext;
                                              temp.address = " ";
                                              temp.phone = null;
                                              temp.filingFee = null;
                                              temp.courtType = null;
                                              searchData.push(temp);     
              } else {
             await Newmexico.find({zipcodes:regex[i]}, function(err, allCampgrounds){
                  if(err){
                          console.log(err);
                  } else {

                    if( allCampgrounds ==null) {
                      var temp ={};
                      var errortext = `Your court information could not be found. 1. Please verify your input address is a valid address. 2. The address might be located outside of our developed states. Please refer to our home page for a current development map.` ;
                                            temp.search = result[i];
                                            temp.fileNum = fileNum[i];
                                            temp.num = 0;
                                            temp.courtName = errortext;
                                            temp.address = " ";
                                            temp.phone = null;
                                            temp.filingFee = null;
                                            temp.courtType = null;
                                            searchData.push(temp); 
                    } else {
                                        // console.log("regex[]=>"+ regex);
                                  allCampgrounds.forEach(function(allCampground,index){
                                      var temp ={};
                                      if(allCampgrounds.length == 1) {temp.num = 0}
                                      else {temp.num = allCampgrounds.length - index;}
                                      temp.search = result[i];
                                      temp.fileNum = temp.fileNum = fileNum[i];
                                      if ( allCampground.courtName.includes("court") || allCampground.courtName.includes("Court") ) {
                                        temp.courtName = allCampground.courtName
                                      } else {
                                        temp.courtName = allCampground.courtName + " Court";
                                      }
                                      temp.districtNum =allCampground.judicalDistrictNum;
                                      temp.address = allCampground.address;
                                      temp.phone = allCampground.phone;
                                      temp.filingFee = allCampground.filingFee;
                                      temp.courtType = allCampground.courtType;
                                      searchData.push(temp); 
                                  })
                         // console.log("Search Data =>"+JSON.stringify(searchData));
                          
                      } 
                     
                      
                     
                  }
                  
                              
              });
            }
            } else if (searchzip[i] >= 89001 && searchzip[i] <= 89883 ) {
              regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
              if((accessid.includes("c") ==false)&&(accessid.includes("C") ==false)) {
                var temp ={};
                        var errortext = `Your court information could not be found. You do not have access to this area. Contact us, if you would like to add this area to your subscription.` ;
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 0;
                                              temp.courtName = errortext;
                                              temp.address = " ";
                                              temp.phone = null;
                                              temp.filingFee = null;
                                              temp.courtType = null;
                                              searchData.push(temp);     
              } else {
            await  Nevada.find({zipcodes:regex[i]}, function(err, allCampgrounds){
                  if(err){
                          console.log(err);
                          var error = "error"
                          res.send(error);                 
                  } else {
  
                    if( allCampgrounds ==null) {
                      var temp ={};
                      var errortext = `Your court information could not be found. 1. Please verify your input address is a valid address. 2. The address might be located outside of our developed states. Please refer to our home page for a current development map.` ;
                                            temp.search = result[i];
                                            temp.fileNum = fileNum[i];
                                            temp.num = 0;
                                            temp.courtName = errortext;
                                            temp.address = " ";
                                            temp.phone = null;
                                            temp.filingFee = null;
                                            temp.courtType = null;
                                            searchData.push(temp); 
                    } else {

                    allCampgrounds.forEach(function(allCampground,index){

                   
                      var temp ={};
                      if(allCampgrounds.length == 1) {temp.num = 0}
                      else {temp.num = allCampgrounds.length - index;}
                      temp.search = result[i];
                      temp.fileNum = fileNum[i];
                      temp.courtName = allCampground.courtName ;
                      temp.districtNum =allCampground.judicalDistrictNum;
                      temp.address = allCampground.address;
                      temp.phone = allCampground.phone;
                      temp.filingFee = allCampground.filingFee;
                      temp.courtType = allCampground.courtType;
                     // temp.Filingfeenotes = allCampground.Filingfeenotes;
                      searchData.push(temp); 
                  })
                                        // console.log("regex[]=>"+ regex);                                  
                         // console.log("Search Data =>"+JSON.stringify(searchData));
                          
                      } 
                      
                     
                  
                  }              
              });
            }
            } else if(  (searchzip >= 85532 && searchzip <= 85554)||(searchzip >= 85601 && searchzip <= 85658)||(searchzip >= 85670 && searchzip <= 86556)) {
              
              regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
              if((accessid.includes("a") ==false)&&(accessid.includes("A") ==false)) {
                var temp ={};
                        var errortext = `Your court information could not be found. You do not have access to this area. Contact us, if you would like to add this area to your subscription.` ;
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 0;
                                              temp.courtName = errortext;
                                              temp.address = " ";
                                              temp.phone = null;
                                              temp.filingFee = null;
                                              temp.courtType = null;
                                              searchData.push(temp);     
              } else {
            await  Arizona_zip.findOne({zipcodes:regex}, function(err, allCampgrounds){
                if(err){
                        console.log(err);
                        var error = "error"
                       // res.send(error);                 
                } else {
                        if(allCampgrounds==null) {
                         // res.send("error");
                        }else {
                                      // console.log("regex[]=>"+ regex);
                                    var temp ={};
                                    temp.search = result[i];
                                    temp.fileNum = fileNum[i];
                                    temp.num = 2;
                                    temp.districtNum =allCampgrounds.judicalDistrictNum;
                                    if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                                      temp.courtName = allCampgrounds.courtName
                                    } else {
                                      temp.courtName = allCampgrounds.courtName + " Court";
                                    }
                                    temp.address = allCampgrounds.address;
                                    temp.phone = allCampgrounds.phone;
                                    temp.filingFee = allCampgrounds.filingFee;
                                    temp.courtType = allCampgrounds.courtType;
                                    searchData.push(temp); 
                  }
                  }
            
                            
            });

            var fetchstring = 'https://maps.googleapis.com/maps/api/geocode/json?address='+result[i]+'&key=AIzaSyA1T95uAq72g2rFXa1hhyJD3De1NdE6OxI';
            fetch(fetchstring)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (myJson) {
                        console.log(JSON.stringify(myJson));
                         var countyname = myJson.results[0].address_components[2].long_name;
                       console.log(JSON.stringify(countyname));
                     
                       console.log("AZ =>"+ countyname);
                     
                       Az_county.findOne({countyname:countyname}, function(err, allCampgrounds){
                        if(err){
                                console.log(err);
                        } else {
                            if (allCampgrounds==null) {
                              var error = "error";
                              console.log("here?");
                            } else {
                              
                                              // console.log("regex[]=>"+ regex);
                                              var temp ={};
                                              temp.search = result[i];
                                              temp.fileNum = fileNum[i];
                                              temp.num = 1;
                                              temp.districtNum =allCampgrounds.judicalDistrictNum;
                                              if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                                                temp.courtName = allCampgrounds.courtName
                                              } else {
                                                temp.courtName = allCampgrounds.courtName + " Court";
                                              }
                                              temp.address = allCampgrounds.address;
                                              temp.phone = allCampgrounds.phone;
                                              temp.filingFee = allCampgrounds.filingFee;
                                              temp.courtType = allCampgrounds.courtType;
                                              searchData.push(temp); 
                              //  console.log("Search Data =>"+JSON.stringify(searchData));
                                
                            }
                            } 
                           
                              
                    });
                    });

            }
          }
            else {
              regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
              console.log(regex[i]+" "+i);
              var temp ={};
              var errortext = `Your court information could not be found. 1. Please verify your input address is a valid address. 2. The address might be located outside of our developed states.Please refer to our home page for a current development map.` ;

                temp.search = result[i];
                temp.fileNum = fileNum[i];
                temp.num = 0;
                temp.courtName = errortext;
                temp.address = " ";
                temp.phone = null;
                temp.filingFee = null;
                temp.courtType = null;
               // if( parseInt(temp.fileNum) !== NaN ) {
                  //searchData.push(temp); 
               // }
                
            }
        
       
        }

        if(username) {
          User.find({username:req.query.username}, function(err, user){
            if (err) {
              console.log(err);
              res.redirect("/search");
            } else {
              searchData.forEach((data,index) => {
                  Comment.create(data, function(err, comment){
                      if(err){
                          
                          console.log(err);
                      } else {
                          //add username and id to comment
                          
                          comment.username = req.query.username;
                          comment.search = data.search;
                          comment.courtName = data.courtName;
                          comment.address = data.address;
                          comment.phone = data.phone;
                          comment.filingFee = data.filingFee;
                          //save comment
                          comment.save();
                        //   console.log(comment);
                          
                      }
                    });
              });
            }
          });
     
        }


      
      var header =["File Number","Input Address","Distric Number","Court Type", "Court Name",
        "Court Address","Phone Number","Filing Fee","Distric Number","Court Type", "Court Name",
        "Court Address","Phone Number","Filing Fee"];
      output.push(header.join());
      let row = [];
       console.log(JSON.stringify(searchData));
      await  searchData.forEach(async (d) => {
             // a new array for each row of data
             if (d.num ==0 ) {
              row.push(d.fileNum);
              if (conditionlength===2) {
                row.push(d.search);
              } else {
                row.push(`"${d.search}"`);
              }
              row.push(d.districtNum);
              row.push(d.courtType);
              row.push(d.courtName);
              row.push(`"${d.address}"`);
              row.push(d.phone);
              row.push(d.filingFee);
              output.push(row.join());
              row = [];
             }
            else if(d.num != 1){
              row.push(d.fileNum);
            if (conditionlength===2) {
              row.push(d.search);
            } else {
              row.push(`"${d.search}"`);
            }
            row.push(d.districtNum);
            row.push(d.courtType);
            row.push(d.courtName);
            row.push(`"${d.address}"`);
            row.push(d.phone);
            row.push(d.filingFee);
            
          } else {
            //row.push(d.fileNum);
           /*  if (conditionlength===2) {
              row.push(d.search);
            } else {
              row.push(`"${d.search}"`);
            } */
            row.push(d.districtNum);
            row.push(d.courtType);
            row.push(d.courtName);
            row.push(`"${d.address}"`);
            row.push(d.phone);
            row.push(d.filingFee);
           
           
            output.push(row.join());
            row = [];
          }

            
          outputPath = __dirname + '/uploads/'+ path+'.csv';
          //  console.log("row =>" +row); // by default, join() uses a ','
        await fs.writeFileSync(outputPath, output.join(os.EOL)); 
          });
          console.log("outputpath=>"+outputPath);
      
          try {
            if (fs.existsSync(outputPath)) {
              //file exists
              await res.download(outputPath);
            } else {
              var err = "error"
              console.error(err);
            res.redirect("/search");
            }
              
          } catch(err) {
            console.error(err);
            res.redirect("/search");
          }
    
      })()

       
     
  })
 
// Async / await usage
//const jsonArray=await csv().fromFile(csvFilePath);
    } else {
      req.flash("success","Please upload again!")
      res.render("campgrounds/index",{campgrounds:null,allhistory:null}); 
    }
 });


 /* app.post('/download', function(req, res){
  if(outputPath !==undefined) {
  res.download(outputPath);
} else{  
  req.flash("success","You didn't upload file");
  res.render("campgrounds/index",{campgrounds:null,allhistory:null });
}
}); */
/* stripe.products.create({
  name: 'singlebatchsearch',
  type: 'service',
}, function(err, product) {
  console.log(JSON.stringify(product.id));
}); */

/* stripe.plans.create({
    
  amount: 4000,
  nickname :"batchmonthlymember40",
  interval: "month",
  product: "prod_F3FYjoVwslkAOO",
  currency: "usd",
}, function(err, plan) {
  // asynchronously called
  console.log(JSON.stringify(plan.id));
}); */
app.post('/charge/:id',(req,res) =>{
  
  console.log("REQ:=>"+req.body.accessid);
  var accessid = req.body.accessid;
  var planid = "";
  var day;
  console.log(accessid.charCodeAt(0));
switch (accessid.length) {
  case 1:
  if(accessid.charCodeAt(0) <= 90) {
    planid = "plan_F3FbAYYdIZ4xRf";
  } //$10 per month
  else {
    planid = "plan_F3FOlWNXju3VK0";
  } //$5 per month
    break;
  case 2:
  if(accessid.charCodeAt(0) <= 90) {
    planid = "plan_F3FcOiuKXLYGPb";
  } //20
  else {
    planid = "plan_F3FQmLBrbcTnvP";
  } //10
    break;
  case 3:
  if(accessid.charCodeAt(0) <= 90) {
    planid = "plan_F3FcwUpbKxZBNh";
  } //30
  else {
    planid = "plan_F3FSIG40SEoldK";
  } //15
    break;
  case 4:
  if(accessid.charCodeAt(0) <= 90) {
    planid = "plan_F3GJUsFHKRlu4S";
  } //40
  else {
    planid = "plan_F3FTxsAHm0dBk1";
  } //20
    break;
}
  
  stripe.customers.create({
    email:req.body.stripeEmail,
    source : req.body.stripeToken
  })
  .then(customer => stripe.subscriptions.create({
    customer :customer.id,
    items :[{
      plan: planid,
    },]
    
  }, function(err,subscription){
    console.log(err);
    console.log(subscription);
    var today = new Date(Date.now());
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
    var today = dd + '/' + mm + '/' + yyyy;

    User.findOneAndUpdate({ username: req.params.id }, { $set: { email: req.body.stripeEmail,customerid:customer.id,subscription:true,accessid: accessid,subscriptionDate:today}}, { new: true }, function(err, doc) {
     
        if (err) {
            console.log("Something wrong when updating data!");
        }
        console.log(doc);
    });
    req.flash("success", req.params.id+", Your subscription was set correctly");
    res.redirect("/search");

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
app.post('/chargemore/:id',(req,res) =>{
  
  
  stripe.customers.create({
    email:req.body.stripeEmail,
    source : req.body.stripeToken
  })
  .then(customer => stripe.subscriptions.create({
    customer :customer.id,
    items :[{
      plan:"prod_F2gRnmeBcubeEg",
    },]
    
  }, function(err,subscription){
    var today = new Date(Date.now());
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
    var today = dd + '/' + mm + '/' + yyyy;

    User.findOneAndUpdate({ username: req.params.id }, { $set: { email: req.body.stripeEmail,customerid:customer.id,subscription2:true,subscriptionDate:today}}, { new: true }, function(err, doc) {
     
        if (err) {
            console.log("Something wrong when updating data!");
        }
        console.log(doc);
    });
    req.flash("success", req.params.id+", Your subscription was set correctly");
    res.redirect("/search");

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
app.get('/downgrade/:id',(req,res) =>{
  User.findOne({ username: req.params.id }, function (err, adventure) {
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
      res.redirect("/search");
  
      //res.render("campgrounds/index",{campgrounds:null,noMatch:"Thank you for your payment." });
     
    })
  });  
  //.then(subscription => res.render("campgrounds/index",{campgrounds:null,noMatch:"Thank you for your payment." }));

})
app.get('/charge',(req,res)=>{
  res.redirect("/login")
})

app.get('/ajaxcall/:id', function (req,res) {
  Comment.find({username:req.params.id}, function(err, allhistory){
    if(err){
      console.log(req);
      console.log(err);
      res.send(err);
    };
    var temp = []; temp = allhistory;
    while(temp.length > 500) {
      temp.shift();
    }
    res.send(temp);
  })
  
  
})

app.post('/getsearch/:id', function (req,res) {
 
  console.log(req.body);
  var searchData =[];
    
    console.log(req);
    if(req.body.text ) {
        var result;
        var searchquery=[];
        var searchzip =[];
        var accessid = req.body.accessid;
        result = req.body.text;
        console.log(typeof(req.query.search));
        console.log("result "+result.length);
        if(result.length <= 13) {
          var error = "error"
           res.send(error);
            
        } else {
            searchquery = result.slice(result.length-6,result.length).trim();
            searchzip= parseInt(searchquery);
            if ((searchzip > 80000 && searchzip < 81659) ) {
                regex = new RegExp(escapeRegex(searchquery), 'gi');
                if((accessid.includes("d") ==false)&&(accessid.includes("D") ==false)) {
                  var error = "accesserror"
                  res.send(error);     
                } else {
                Campground.findOne({zipcodes:regex}, function(err, allCampgrounds){
                    if(err){
                            console.log(err);
                            var error = "error"
                            res.send(error);                 
                    } else {
                      if(allCampgrounds==null) {
                        res.send("error");}else {
                                          // console.log("regex[]=>"+ regex);
                                        var temp ={};
                                        temp.search = req.body.text;
                                        temp.courtName = allCampgrounds.courtName + " Court";
                                        temp.address = allCampgrounds.address;
                                        temp.phone = allCampgrounds.phone;
                                        temp.filingFee = allCampgrounds.filingFee;
                                        temp.courtType = allCampgrounds.courtType;
                                        searchData.push(temp); 
                           // console.log("Search Data =>"+JSON.stringify(searchData));
                            
                       
                        res.send(searchData);
                      } 
                    } 
                        if(req.params.id) {
                            User.findOne({username:req.params.id}, function(err, user){
                                if(err){
                                    console.log(err);
                                    res.redirect("/search");
                                } else {
                                    searchData.forEach((data,index) => {
                                        Comment.create(data, function(err, comment){
                                            if(err){
                                                
                                                console.log(err);
                                            } else {
                                                //add username and id to comment
                                               
                                                comment.username = req.params.id;
                                                comment.search = data.search;
                                                comment.courtName = data.courtName;
                                                comment.address = data.address;
                                                comment.phone = data.phone;
                                                comment.filingFee = data.filingFee;
                                                //save comment
                                                comment.save();
                                              //  console.log(comment);
                                                
                                            }
                                         });
                                    });
                                }
                            });
                       
                    }
                    
                                
                });
              }
            }  else if( (searchzip >= 85532 && searchzip <= 85554)||(searchzip >= 85601 && searchzip <= 85658)||(searchzip >= 85670 && searchzip <= 86556)) {

              if((accessid.includes("a") ==false)&&(accessid.includes("A") ==false)) {
                var error = "accesserror"
                res.send(error);     
              } else {
                Arizona_zip.findOne({zipcodes:regex}, function(err, allCampgrounds){
                    if(err){
                            console.log(err);
                            var error = "error"
                           // res.send(error);                 
                    } else {
                            if(allCampgrounds==null) {
                             // res.send("error");
                            }else {
                                          // console.log("regex[]=>"+ regex);
                                        var temp ={};
                                        temp.search = req.body.text;
                                        temp.courtName = allCampgrounds.courtName + " Court";
                                        temp.address = allCampgrounds.address;
                                        temp.phone = allCampgrounds.phone;
                                        temp.filingFee = allCampgrounds.filingFee;
                                        temp.courtType = allCampgrounds.courtType;
                                        searchData.push(temp); 
                           // console.log("Search Data =>"+JSON.stringify(searchData));
                            
                         
                       // res.send(searchData);
                      }
                      }

                        if(req.params.id) {
                            User.findOne({username:req.params.id}, function(err, user){
                                if(err){
                                    console.log(err);
                                    res.redirect("/search");
                                } else {
                                    searchData.forEach((data,index) => {
                                        Comment.create(data, function(err, comment){
                                            if(err){
                                                
                                                console.log(err);
                                            } else {
                                                //add username and id to comment
                                               
                                                comment.username = req.params.id;
                                                comment.search = data.search;
                                                comment.courtName = data.courtName;
                                                comment.address = data.address;
                                                comment.phone = data.phone;
                                                comment.filingFee = data.filingFee;
                                                //save comment
                                                comment.save();
                                              //  console.log(comment);
                                                
                                            }
                                         });
                                    });
                                }
                            });
                       
                    }
                    
                                
                });
                var fetchstring = 'https://maps.googleapis.com/maps/api/geocode/json?address='+result+'&key=AIzaSyA1T95uAq72g2rFXa1hhyJD3De1NdE6OxI'
                fetch(fetchstring)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (myJson) {
                        console.log(JSON.stringify(myJson));
                         var countyname = myJson.results[0].address_components[2].long_name;
                       console.log(JSON.stringify(countyname));
                     
                       console.log("AZ =>"+ countyname);
                       regex =countyname;
                      
                       Az_county.findOne({countyname:regex}, function(err, allCampgrounds){
                        if(err){
                                console.log(err);
                        } else {
                            if (allCampgrounds==null) {
                              var error = "error";
                              res.send(searchData);
                              console.log("here?");
                            } else {
                              
                                              // console.log("regex[]=>"+ regex);
                                            var temp ={};
                                            temp.search = req.body.text;
                                            if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                                              temp.courtName = allCampgrounds.courtName
                                            } else {
                                              temp.courtName = allCampgrounds.courtName + " Court";
                                            }
                                            temp.address = allCampgrounds.address;
                                            temp.phone = allCampgrounds.phone;
                                            temp.courtType = allCampgrounds.courtType;
                                            temp.filingFee = allCampgrounds.filingFee;
                                            searchData.push(temp); 
                               // console.log("Search Data =>"+JSON.stringify(searchData));
                                res.send(searchData);
                             
                            }
                            } 
                           
                            if(req.params.id) {
                                User.findOne({username:req.params.id}, function(err, user){
                                    if(err){
                                        console.log(err);
                                        var error = "error"
                                        res.send(error);                         
                                    } else {
                                        searchData.forEach((data,index) => {
                                            Comment.create(data, function(err, comment){
                                                if(err){
                                                    
                                                    console.log(err);
                                                } else {
                                                    //add username and id to comment
                                                   
                                                    comment.username = req.params.id;
                                                    comment.search = data.search;
                                                    comment.courtName = data.courtName;
                                                    comment.address = data.address;
                                                    comment.phone = data.phone;
                                                    comment.filingFee = data.filingFee;
                                                    //save comment
                                                    comment.save();
                                                    console.log(comment);
                                                    
                                                }
                                             });
                                        });
                                    }
                                });
                           
                        }
                        
                                    
                    });
                    });

                  }
            }
            else if((searchzip >= 85117 && searchzip <= 85194)||(searchzip == 85618 || searchzip == 85623 || searchzip ==85631)) {
              if((accessid.includes("a") ==false)&&(accessid.includes("A") ==false)) {
                var error = "accesserror"
                res.send(error);     
              } else {
              var fetchstring = 'https://maps.googleapis.com/maps/api/geocode/json?address='+result+'&key=AIzaSyA1T95uAq72g2rFXa1hhyJD3De1NdE6OxI'
              fetch(fetchstring)
                  .then(function (response) {
                      return response.json();
                  })
                  .then(function (myJson) {
                      console.log(JSON.stringify(myJson));
                     var address_position = myJson.results[0].geometry.location;
                     console.log(JSON.stringify(address_position));
                     var courtname = searchpinal(address_position);
                     console.log("AZ =>"+ courtname);
                     regex =courtname;
                     
                     pinal.findOne({courtName:regex}, function(err, allCampgrounds){
                      if(err){
                              console.log(err);
                      } else {
                          if (allCampgrounds==null) {
                            var error = "error";
                            
                          } else {
                            if(allCampgrounds==null) {
                             }else {
                                            // console.log("regex[]=>"+ regex);
                                          var temp ={};
                                          temp.search = req.body.text;
                                          temp.courtName = allCampgrounds.courtName + " Court";
                                          temp.address = allCampgrounds.address;
                                          temp.phone = allCampgrounds.phone;
                                          temp.courtType = allCampgrounds.courtType;
                                          temp.filingFee = allCampgrounds.filingFee;
                                          searchData.push(temp); 
                             // console.log("Search Data =>"+JSON.stringify(searchData));
                              
                            }
                          }
                          } 
                         
                          if(req.params.id) {
                              User.findOne({username:req.params.id}, function(err, user){
                                  if(err){
                                      console.log(err);
                                                          
                                  } else {
                                      searchData.forEach((data,index) => {
                                          Comment.create(data, function(err, comment){
                                              if(err){
                                                  
                                                  console.log(err);
                                              } else {
                                                  //add username and id to comment
                                                 
                                                  comment.username = req.params.id;
                                                  comment.search = data.search;
                                                  comment.courtName = data.courtName;
                                                  comment.address = data.address;
                                                  comment.phone = data.phone;
                                                  comment.filingFee = data.filingFee;
                                                  //save comment
                                                  comment.save();
                                                  console.log(comment);
                                                  
                                              }
                                           });
                                      });
                                  }
                              });
                         
                      }
                      
                                  
                  });
                  //var countyname = myJson.results[0].address_components[2].long_name;
                
                
                 // console.log("AZ =>"+ countyname);
                 // var countyname = "Pima County"
                 Az_county.findOne({countyname:"Pinal County"}, function(err, allCampgrounds){
                  if(err){
                          console.log(err);
                  } else {
                      if (allCampgrounds==null) {
                        if(searchData == null) {searchData="error"}
                            res.send(searchData);
                        console.log("here?");
                      } else {
                        
                                        // console.log("regex[]=>"+ regex);
                                      var temp ={};
                                      temp.search = req.body.text;
                                      if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                                        temp.courtName = allCampgrounds.courtName
                                      } else {
                                        temp.courtName = allCampgrounds.courtName + " Court";
                                      }
                                      temp.address = allCampgrounds.address;
                                      temp.phone = allCampgrounds.phone;
                                      temp.courtType = allCampgrounds.courtType;
                                      temp.filingFee = allCampgrounds.filingFee;
                                      searchData.push(temp); 
                         // console.log("Search Data =>"+JSON.stringify(searchData));
                          res.send(searchData);
                      }
                      } 
                     
                      if(req.params.id) {
                          User.findOne({username:req.params.id}, function(err, user){
                              if(err){
                                  console.log(err);
                                  var error = "error"
                                  res.send(error);                         
                              } else {
                                  searchData.forEach((data,index) => {
                                      Comment.create(data, function(err, comment){
                                          if(err){
                                              
                                              console.log(err);
                                          } else {
                                              //add username and id to comment
                                             
                                              comment.username = req.params.id;
                                              comment.search = data.search;
                                              comment.courtName = data.courtName;
                                              comment.address = data.address;
                                              comment.phone = data.phone;
                                              comment.filingFee = data.filingFee;
                                              //save comment
                                              comment.save();
                                              console.log(comment);
                                              
                                          }
                                       });
                                  });
                              }
                          });
                     
                  }
                  
                              
              });
                  });
                }
            }
            else if ((searchzip >= 85001 && searchzip <= 85087)||(searchzip >= 85201 && searchzip <= 85390) ) {     //maricopa county logic
              /* maricopa.num = i; maricopa.address = result[i];
              paramadrress.push(maricopa); */
              if((accessid.includes("a") ==false)&&(accessid.includes("A") ==false)) {
                var error = "accesserror"
                res.send(error);     
              } else {
              var fetchstring = 'https://maps.googleapis.com/maps/api/geocode/json?address='+result+'&key=AIzaSyA1T95uAq72g2rFXa1hhyJD3De1NdE6OxI'
            fetch(fetchstring)
                .then(function (response) {
                    return response.json();
                })
                .then(function (myJson) {
                    console.log(JSON.stringify(myJson));
                   var address_position = myJson.results[0].geometry.location;
                   console.log(JSON.stringify(address_position));
                   var courtname = searchmaricopa(address_position);
                   console.log("AZ =>"+ courtname);
                   regex =courtname;

                   maricopa.findOne({courtName:regex}, function(err, allCampgrounds){
                    if(err){
                            console.log(err);
                    } else {
                                          // console.log("regex[]=>"+ regex);
                                        var temp ={};
                                        temp.search = req.body.text;
                                        temp.courtName = allCampgrounds.courtName + " Court";
                                        temp.address = allCampgrounds.address;
                                        temp.phone = allCampgrounds.phone;
                                        temp.courtType = allCampgrounds.courtType;
                                        temp.filingFee = allCampgrounds.filingFee;
                                        searchData.push(temp); 
                           // console.log("Search Data =>"+JSON.stringify(searchData));
                            
                        }       
                });

                Az_county.findOne({countyname:"Maricopa County"}, function(err, allCampgrounds){
                        if(err){
                                console.log(err);
                        } else {
                            if (allCampgrounds==null) {
                              var error = "error";
                              res.send(searchData);
                              console.log("here?");
                            } else {
                              
                                              // console.log("regex[]=>"+ regex);
                                            var temp ={};
                                            temp.search = req.body.text;
                                            if ( allCampgrounds.courtName.includes("court") || allCampgrounds.courtName.includes("Court") ) {
                                              temp.courtName = allCampgrounds.courtName
                                            } else {
                                              temp.courtName = allCampgrounds.courtName + " Court";
                                            }
                                            temp.address = allCampgrounds.address;
                                            temp.phone = allCampgrounds.phone;
                                            temp.courtType = allCampgrounds.courtType;
                                            temp.filingFee = allCampgrounds.filingFee;
                                            searchData.push(temp); 
                                //console.log("Search Data =>"+JSON.stringify(searchData));
                                res.send(searchData);
                             
                            }
                            } 
                           
                            if(req.params.id) {
                                User.findOne({username:req.params.id}, function(err, user){
                                    if(err){
                                        console.log(err);
                                        var error = "error"
                                        res.send(error);                         
                                    } else {
                                        searchData.forEach((data,index) => {
                                            Comment.create(data, function(err, comment){
                                                if(err){
                                                    
                                                    console.log(err);
                                                } else {
                                                    //add username and id to comment
                                                   
                                                    comment.username = req.params.id;
                                                    comment.search = data.search;
                                                    comment.courtName = data.courtName;
                                                    comment.address = data.address;
                                                    comment.phone = data.phone;
                                                    comment.filingFee = data.filingFee;
                                                    //save comment
                                                    comment.save();
                                                    console.log(comment);
                                                    
                                                }
                                             });
                                        });
                                    }
                                });
                           
                        }
                        
                                    
                    });
              
                });
             /* const syncReturn = syncFunction(result[i]);
              regex[i] =new RegExp(escapeRegex(syncReturn), 'gi');
              console.log("sycnReturn =>"+ syncReturn);
              console.log("regex =>"+i+"=>" +regex[i]);
              searchquery[i] = syncReturn; */
              }
          } else if (searchzip >= 87001 && searchzip <= 88439) {
            regex = new RegExp(escapeRegex(searchquery), 'gi');
            console.log("cities"+ regex);
            if((accessid.includes("b") ==false)&&(accessid.includes("B") ==false)) {
              var error = "accesserror"
              res.send(error);     
            } else {
            Newmexico.find({zipcodes:regex}, function(err, allCampgrounds){
                if(err){
                        console.log(err);
                } else {
                  if(allCampgrounds==null) {
                    res.send("error");}else {
                                      // console.log("regex[]=>"+ regex);
                                allCampgrounds.forEach(function(allCampground,index){
                                    var temp ={};
                                    temp.search = req.body.text;
                                    temp.courtName = allCampground.courtName  ;
                                    temp.address = allCampground.address;
                                    temp.phone = allCampground.phone;
                                    temp.filingFee = allCampground.filingFee;
                                    temp.courtType = allCampground.courtType;
                                    searchData.push(temp); 
                                })
                       // console.log("Search Data =>"+JSON.stringify(searchData));
                        
                    
                    res.send(searchData);
                    }
                  }
                    if(req.params.id) {
                        User.findOne({username:req.params.id}, function(err, user){
                            if(err){
                                console.log(err);
                                res.redirect("/search");
                            } else {
                                searchData.forEach((data,index) => {
                                    Comment.create(data, function(err, comment){
                                        if(err){
                                            
                                            console.log(err);
                                        } else {
                                            //add username and id to comment
                                           
                                            comment.username = req.params.id;
                                            comment.search = data.search;
                                            comment.courtName = data.courtName;
                                            comment.address = data.address;
                                            comment.phone = data.phone;
                                            comment.filingFee = data.filingFee;
                                            //save comment
                                            comment.save();
                                            console.log(comment);
                                            
                                        }
                                     });
                                });
                            }
                        });
                   
                }
                
                            
            });
          }
          } else if (searchzip >= 89001 && searchzip <= 89883 ) {
            if((accessid.includes("c") ==false)&&(accessid.includes("C") ==false)) {
              var error = "accesserror"
              res.send(error);     
            } else {
            regex = new RegExp(escapeRegex(searchquery), 'gi');
            Nevada.find({zipcodes:regex}, function(err, allCampgrounds){
                if(err){
                        console.log(err);
                        var error = "error"
                        res.send(error);                 
                } else {
                  if(allCampgrounds==null) {
                    res.send("error");}else {
                  allCampgrounds.forEach(function(allCampground,index){
                    var temp ={};
                    
                    temp.search = req.body.text;
                    if ( allCampground.courtName.includes("court") || allCampground.courtName.includes("Court") ) {
                      temp.courtName = allCampground.courtName
                    } else {
                      temp.courtName = allCampground.courtName + " Court";
                    }
                    temp.districtNum =allCampground.judicalDistrictNum;
                    temp.address = allCampground.address;
                    temp.phone = allCampground.phone;
                    temp.filingFee = allCampground.filingFee;
                    temp.courtType = allCampground.courtType;
                    temp.Filingfeenotes = allCampground.Filingfeenotes;
                    searchData.push(temp); 
                })
                                      // console.log("regex[]=>"+ regex);                                  
                     //   console.log("Search Data =>"+JSON.stringify(searchData));
                        
                     
                    res.send(searchData);
                  }
                }
                    if(req.params.id) {
                        User.findOne({username:req.params.id}, function(err, user){
                            if(err){
                                console.log(err);
                                res.redirect("/search");
                            } else {
                                searchData.forEach((data,index) => {
                                    Comment.create(data, function(err, comment){
                                        if(err){
                                            
                                            console.log(err);
                                        } else {
                                            //add username and id to comment
                                           
                                            comment.username = req.params.id;
                                            comment.search = data.search;
                                            comment.courtName = data.courtName;
                                            comment.address = data.address;
                                            comment.phone = data.phone;
                                            comment.filingFee = data.filingFee;
                                            //save comment
                                            comment.save();
                                          //  console.log(comment);
                                            
                                        }
                                     });
                                });
                            }
                        });
                   
                }
                
                            
            });
          }
          }
          else{
              regex = new RegExp(escapeRegex(searchquery), 'gi'); 
              var error = "error";
              res.send(error);
          }
    
        }
       
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
               var error = "error";
               res.send(error);
           } else {
             var error = "error"
              res.send(error)
           }
        });
    }
  
  
})

app.get('/history/:id',(req,res) =>{
  console.log(req);
  Comment.find({username:req.params.id}, function(err, allhistory){
    if(err){
      console.log(req);
      console.log(err);
    }
    res.render("campgrounds/index",{campgrounds:null,allhistory:allhistory});
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

function makeid(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}



async function getquery(address) {
  try {
    // fetch data from a url endpoint
    const response = await axios({
      method: 'get',
      url:  address,
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }
    });
    //const data = await response.map(res => res );;
    console.log("response "+Object.keys(response));
   
    var courtname = searchmaricopa(response.data.results[0].geometry.location);
    console.log("=>"+courtname);
    return courtname;
  } catch (error) {
    console.log(error); // catches both errors
  }
}

async function getquerypinal(address) {
  try {
    // fetch data from a url endpoint
    const response = await axios({
      method: 'get',
      url:  address,
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }
    });
    //const data = await response.map(res => res );;
    console.log("response "+Object.keys(response));
   
    var courtname = searchpinal(response.data.results[0].geometry.location);
    console.log("pinal=>"+courtname);
    return courtname;
  } catch (error) {
    console.log(error); // catches both errors
  }
}