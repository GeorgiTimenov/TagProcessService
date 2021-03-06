var express = require("express");
var router  = express.Router();
var Campground = require("../models/campgrounds");
var middleware = require("../middleware");

//INDEX - show all campgrounds
router.get("/", function(req, res){
    var searchData =[];
    var noMatch = null;
    if(req.query.search ) {
        var result;
        var searchquery=[];
        var regex =[]
        result = req.query.search.trim().split("\n");
        //console.log(typeof(req.query.search));
        //console.log("result "+result.length);
        for(var i = 0; i< result.length;i++ ) { 
            searchquery[i] = result[i].slice(result[i].length-6,result[i].length).trim();
            /* searchquery[i] = Number(searchquery[i]);
            if (searchquery[i] < 80000 && searchquery[i] > 81659) {

            } */
             regex[i] = new RegExp(escapeRegex(searchquery[i]), 'gi');
             console.log("search query=" +i+ "=>"+regex[i]);
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
                                if (i == result.length - 1 ) temp.search = result[i]+"\n";
                                else {temp.search = result[i];}
                                temp.courtName = allCampgrounds[j].courtName;
                                temp.address = allCampgrounds[j].address;
                                temp.phone = allCampgrounds[j].phone;
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
                res.render("campgrounds/index",{campgrounds:searchData,noMatch: noMatch});  
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
              res.render("campgrounds/index",{campgrounds:null, noMatch: noMatch});
           }
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
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
});

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

