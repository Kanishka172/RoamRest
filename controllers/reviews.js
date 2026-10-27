const Listing=require("../models/listing");
const Review=require("../models/review");

module.exports.createReview=async(req,res)=>{

    let listing=await Listing.findById(req.params.id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let {rating,comment}=req.body.review;

    await Review.create({listingId:listing.id,authorId:req.user.id,rating,comment});
    req.flash("success","New Review Created!");

    res.redirect(`/listings/${listing.id}`);
}

module.exports.destroyReview=async(req,res)=>{
    let {id,reviewId}=req.params;

    await Review.destroy(reviewId,id);
    req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);
}
