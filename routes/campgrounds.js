var express = require("express");
var router  = express.Router();
var Campground = require("../models/campgrounds");
var Newmexico = require("../models/NewMexico");
var middleware = require("../middleware");
var csrf = require('csurf');
var passport = require('passport');
var csrfProtection = csrf();
var User = require("../models/user");
var Comment = require("../models/comment");
var JSAlert = require("js-alert");

router.use(csrfProtection);
    const forceSync = require('sync-rpc');
   // const syncFunction = forceSync(require.resolve('./searchmaricopa'));
const fetch = require('node-fetch');
const { searchmaricopa } = require('./searchmaricopa');
    var regex =[];
//INDEX - show all campgrounds
router.get("/", function(req, res){
    var searchData =[];
    
    //console.log(req);
    if(req.query.search ) {
        var result;
        var searchquery=[];
        var searchzip =[]
        result = req.query.search;
        //console.log(typeof(req.query.search));
        //console.log("result "+result.length);
        if(result.length <= 13) {
          
            res.render("campgrounds/index",{campgrounds:null,allhistory:null});

        } else {
            searchquery = result.slice(result.length-6,result.length).trim();
            searchzip= parseInt(searchquery);
            if ((searchzip > 80000 && searchzip < 81659) || (searchzip >88900 && searchzip < 89836)) {
                regex = new RegExp(escapeRegex(searchquery), 'gi');
                Campground.findOne({zipcodes:regex}, function(err, allCampgrounds){
                    if(err){
                            console.log(err);
                    } else {
                                          // console.log("regex[]=>"+ regex);
                                        var temp ={};
                                        temp.search = req.query.search;
                                        temp.courtName = allCampgrounds.courtName + " Court";
                                        temp.address = allCampgrounds.address;
                                        temp.phone = allCampgrounds.phone;
                                        temp.filingFee = allCampgrounds.filingFee;
                                        searchData.push(temp); 
                            console.log("Search Data =>"+JSON.stringify(searchData));
                            
                        } 
                        res.render("campgrounds/index",{campgrounds:searchData,allhistory:null});
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
            }  else if (searchzip >= 85001 && searchzip <= 85385 ) {     
              /* maricopa.num = i; maricopa.address = result[i];
              paramadrress.push(maricopa); */
              var fetchstring = 'https://maps.googleapis.com/maps/api/geocode/json?address='+result+'&key=AIzaSyA1T95uAq72g2rFXa1hhyJD3De1NdE6OxI'
            fetch(fetchstring)
                .then(function (response) {
                    return response.json();
                })
                .then(function (myJson) {
                    //console.log(JSON.stringify(myJson));
                   var address_position = myJson.results[0].geometry.location;
                   //console.log(JSON.stringify(address_position));
                   var courtname = searchmaricopa(address_position);
                   console.log("AZ =>"+ courtname);
                   regex =courtname;
                   Campground.findOne({courtName:regex}, function(err, allCampgrounds){
                    if(err){
                            console.log(err);
                    } else {
                                          // console.log("regex[]=>"+ regex);
                                        var temp ={};
                                        temp.search = req.query.search;
                                        temp.courtName = allCampgrounds.courtName + " Court";
                                        temp.address = allCampgrounds.address;
                                        temp.phone = allCampgrounds.phone;
                                        temp.filingFee = allCampgrounds.filingFee;
                                        searchData.push(temp); 
                            console.log("Search Data =>"+JSON.stringify(searchData));
                            
                        } 
                        res.render("campgrounds/index",{campgrounds:searchData,allhistory:null});
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
              //console.log("sycnReturn =>"+ syncReturn);
              //console.log("regex =>"+i+"=>" +regex[i]);
              searchquery[i] = syncReturn; */
                         
          } else if (searchzip >= 87001 && searchzip <= 88439) {
            regex = result.split(",")[1];
            regex = regex = new RegExp(escapeRegex(regex), 'gi');
            console.log("cities"+ regex);
            Newmexico.find({queryCities:regex}, function(err, allCampgrounds){
                if(err){
                        console.log(err);
                } else {
                                      // console.log("regex[]=>"+ regex);
                                allCampgrounds.forEach(function(allCampground,index){
                                    var temp ={};
                                    temp.search = req.query.search;
                                    temp.courtName = allCampground.courtName  ;
                                    temp.address = allCampground.address;
                                    temp.phone = allCampground.phone;
                                    temp.filingFee = allCampground.filingFee;
                                    temp.courtType = allCampground.courtType;
                                    searchData.push(temp); 
                                })
                        console.log("Search Data =>"+JSON.stringify(searchData));
                        
                    } 
                    res.render("campgrounds/index",{campgrounds:searchData,allhistory:null});
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
          else{
              regex = new RegExp(escapeRegex(searchquery), 'gi'); 
              
          }
    
        }
       
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds:null,allhistory:null});
           }
        });
    }
});

//CREATE - add new campground to DB
/* router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
   
   
    var judicalDistrictNum = req.body.judicalDistrictNum;
    var courtName = req.body.courtName;
    var address = req.body.address;
    var phone = req.body.phone;
    var zipcodes = req.body.zipcodes;
    
    var newCampground = {judicalDistrictNum: "District "+judicalDistrictNum, courtName: courtName, address: address, phone:phone, zipcodes:zipcodes }
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
}); */

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new"); 
 });

 
// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id",middleware.checkCampgroundOwnership, function(req, res){
    // find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
       if(err){
           res.redirect("/campgrounds");
       } else {
           //redirect somewhere(show page)
           res.redirect("/campgrounds/" + req.params.id);
       }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/campgrounds");
      } else {
        res.redirect("/campgrounds");
      }
   });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
