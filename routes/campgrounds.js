var express = require("express");
var router  = express.Router();
var Campground = require("../models/campgrounds");
var middleware = require("../middleware");
var csrf = require('csurf');
var passport = require('passport');
var csrfProtection = csrf();
var User = require("../models/user");
var Comment = require("../models/comment");
router.use(csrfProtection);
    const forceSync = require('sync-rpc');
    const syncFunction = forceSync(require.resolve('./searchmaricopa'));


    var regex =[];
//INDEX - show all campgrounds
router.get("/", function(req, res){
    var searchData =[];
    var noMatch = null;
    //console.log(req);
    if(req.query.search ) {
        var result;
        var searchquery=[];
        var searchzip =[]
        result = req.query.search.trim().split("\n");
        //console.log(typeof(req.query.search));
        //console.log("result "+result.length);
        for(var i = 0; i< result.length;i++ ) { 
            searchquery[i] = result[i].slice(result[i].length-6,result[i].length).trim();
            searchzip[i]= parseInt(searchquery[i]);
            if ((searchzip[i] > 80000 && searchzip[i] < 81659) || (searchzip[i] > 80000 && searchzip[i])) {
                regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
            } 
            else if (searchzip[i] >= 0 && searchzip[i] < 99950 ) {     
                /* maricopa.num = i; maricopa.address = result[i];
                paramadrress.push(maricopa); */
               const syncReturn = syncFunction(result[i]);
                regex[i] =new RegExp(escapeRegex(syncReturn), 'gi');;
                //console.log("sycnReturn =>"+ syncReturn);
                //console.log("regex =>"+i+"=>" +regex[i]);
                searchquery[i] = syncReturn;
                           
            }
            else{
                regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi'); 
            }
            }
           
         Campground.find({zipcodes:regex}, function(err, allCampgrounds){
            if(err){
                    console.log(err);
            } else {
                                  // console.log("regex[]=>"+ regex);

                    if(allCampgrounds.length < 1) {
                        noMatch = "No courts match that query, please try again.";
                    } else{
                    
                    for (var i = 0; i< result.length; i ++) {
                        for (var j = 0; j< allCampgrounds.length; j ++) {
                            //console.log("allcamp => "+ allCampgrounds);
                            //console.log("allcamp[j] => "+ allCampgrounds[j]);
                            var temp= {};
                            if(allCampgrounds[j].zipcodes.includes(searchquery[i])){
                               
                                temp.num = i + 1 ;
                                if (i == result.length - 1 ) temp.search = result[i]+"\n";
                                else {temp.search = result[i];}
                                temp.courtName = allCampgrounds[j].courtName + " Court";
                                temp.address = allCampgrounds[j].address;
                                temp.phone = allCampgrounds[j].phone;
                                temp.filingFee = allCampgrounds[j].filingFee;
                                searchData.push(temp); break;
                               
                                
                            } else {
                                if (j == allCampgrounds.length - 1) {
                                temp.num = i + 1;
                                if (i == result.length - 1 ) temp.search = result[i]+"\n";
                                else {temp.search = result[i];}
                                temp.courtName = "Sorry, We can't find the proper Court\n Please type correct Address"
                                searchData.push(temp);
                                }
                            }
                        }   
                    }
                    //console.log("Search Data =>"+searchData);
                    
                } 
                res.render("campgrounds/index",{campgrounds:searchData,noMatch: null,allhistory:null});
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
            }
                        
        });
        
        //console.log("Dispaly query=" +query);
             // Get all campgrounds from DB
       
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds:null, noMatch: noMatch,allhistory:null});
           }
        });
    }
});
router.get("/",function(req,res){
    res.render("campgrounds/index",{campgrounds:null,noMatch: null,allhistory:null});

})
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
