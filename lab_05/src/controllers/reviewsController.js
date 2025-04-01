const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

// Get all reviews for a product with pagination and sorting
const getProductReviews = async (req, res) => {
  try {
    const db = getDb();
    const productId = req.params.productId;
    
    // Validate productId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Sorting parameters
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortField] = sortOrder;

    // Query reviews for the specific product
    const reviews = await db
      .collection('reviews')
      .find({ productId: new ObjectId(productId).toString() })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await db
      .collection('reviews')
      .countDocuments({ productId: new ObjectId(productId).toString() });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Return reviews with pagination info
    res.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// Add a new review
const createReview = async (req, res) => {
  try {
    const db = getDb();
    const { productId, userId, rating, title, content, pros, cons, verifiedPurchase } = req.body;
    
    // Create review object
    const newReview = {
      productId,
      userId,
      rating: parseInt(rating),
      title,
      content,
      pros: pros || [],
      cons: cons || [],
      verifiedPurchase: verifiedPurchase || false,
      helpfulVotes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the review
    const result = await db.collection('reviews').insertOne(newReview);

    if (result.acknowledged) {
      // Update product rating statistics
      await updateProductRatingStats(productId);
      
      res.status(201).json({
        message: 'Review created successfully',
        reviewId: result.insertedId,
        review: newReview
      });
    } else {
      res.status(400).json({ message: 'Failed to create review' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

// Update an existing review
const updateReview = async (req, res) => {
  try {
    const db = getDb();
    const reviewId = req.params.id;
    
    // Validate reviewId
    if (!ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    const { rating, title, content, pros, cons } = req.body;

    // Create update object
    const updateData = {
      ...(rating && { rating: parseInt(rating) }),
      ...(title && { title }),
      ...(content && { content }),
      ...(pros && { pros }),
      ...(cons && { cons }),
      updatedAt: new Date()
    };

    // Update the review
    const result = await db.collection('reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (result.modifiedCount > 0) {
      // Get the updated review
      const updatedReview = await db.collection('reviews').findOne({ _id: new ObjectId(reviewId) });
      
      // Update product rating statistics if rating was changed
      if (rating) {
        await updateProductRatingStats(updatedReview.productId);
      }
      
      res.json({
        message: 'Review updated successfully',
        review: updatedReview
      });
    } else {
      res.status(400).json({ message: 'No changes were made to the review' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const db = getDb();
    const reviewId = req.params.id;
    
    // Validate reviewId
    if (!ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    // Get the review first to know which product to update stats for
    const review = await db.collection('reviews').findOne({ _id: new ObjectId(reviewId) });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Delete the review
    const result = await db.collection('reviews').deleteOne({ _id: new ObjectId(reviewId) });

    if (result.deletedCount > 0) {
      // Update product rating statistics
      await updateProductRatingStats(review.productId);
      
      res.json({
        message: 'Review deleted successfully',
        reviewId
      });
    } else {
      res.status(400).json({ message: 'Failed to delete review' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

// Update helpful votes
const updateHelpfulVotes = async (req, res) => {
  try {
    const db = getDb();
    const reviewId = req.params.id;
    const { increment } = req.body;
    
    // Validate reviewId
    if (!ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    // Increment or decrement helpful votes (but don't go below 0)
    let updateOperation;
    if (increment) {
      updateOperation = { $inc: { helpfulVotes: 1 } };
    } else {
      // First check current value to avoid negative count
      const review = await db.collection('reviews').findOne({ _id: new ObjectId(reviewId) });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      if (review.helpfulVotes <= 0) {
        return res.status(400).json({ message: 'Helpful votes cannot go below 0' });
      }
      
      updateOperation = { $inc: { helpfulVotes: -1 } };
    }
    
    // Update the review
    const result = await db.collection('reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (result.modifiedCount > 0) {
      // Get the updated review
      const updatedReview = await db.collection('reviews').findOne({ _id: new ObjectId(reviewId) });
      
      res.json({
        message: `Review ${increment ? 'upvoted' : 'downvoted'} successfully`,
        helpfulVotes: updatedReview.helpfulVotes
      });
    } else {
      res.status(400).json({ message: 'Failed to update helpful votes' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating helpful votes', error: error.message });
  }
};

// Advanced search for reviews with multiple filters
const searchReviews = async (req, res) => {
  try {
    const db = getDb();
    
    // Extract filter parameters
    const {
      productId,
      query,
      minRating,
      maxRating,
      verifiedPurchase,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
      hasProsCons
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Product ID filter
    if (productId) {
      if (!ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID format' });
      }
      filter.productId = productId;
    }
    
    // Text search in title and content
    if (query && query.trim() !== '') {
      const searchText = query.trim();
      filter.$or = [
        { title: { $regex: searchText, $options: 'i' } },
        { content: { $regex: searchText, $options: 'i' } }
      ];
    }
    
    // Rating range filter
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) {
        filter.rating.$gte = parseInt(minRating);
      }
      if (maxRating) {
        filter.rating.$lte = parseInt(maxRating);
      }
    }
    
    // Verified purchase filter
    if (verifiedPurchase !== undefined) {
      filter.verifiedPurchase = verifiedPurchase === 'true';
    }
    
    // Filter for reviews with pros and cons
    if (hasProsCons === 'true') {
      filter.$and = [
        { pros: { $exists: true, $ne: [] } },
        { cons: { $exists: true, $ne: [] } }
      ];
    }
    
    // Pagination parameters
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting parameters
    const sortOptions = {};
    sortOptions[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination and sorting
    const reviews = await db
      .collection('reviews')
      .find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    // Get total count for pagination
    const total = await db.collection('reviews').countDocuments(filter);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;
    
    // Return reviews with pagination info and applied filters
    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        productId,
        query,
        minRating,
        maxRating,
        verifiedPurchase,
        hasProsCons,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching reviews', error: error.message });
  }
};

// Get review statistics for a product
const getReviewStatistics = async (req, res) => {
  try {
    const db = getDb();
    const productId = req.params.productId;
    
    // Validate productId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Calculate review statistics
    const stats = await calculateReviewStatistics(productId);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching review statistics', error: error.message });
  }
};

// Helper function to update product rating statistics
async function updateProductRatingStats(productId) {
  try {
    const db = getDb();
    const stats = await calculateReviewStatistics(productId);
    
    // Update the product with new rating statistics
    await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: {
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          ratingDistribution: stats.ratingDistribution
        }
      }
    );
    
    return stats;
  } catch (error) {
    console.error('Error updating product rating stats:', error);
    throw error;
  }
}

// Helper function to calculate review statistics
async function calculateReviewStatistics(productId) {
  const db = getDb();
  
  // Get all reviews for the product
  const reviews = await db
    .collection('reviews')
    .find({ productId: productId.toString() })
    .toArray();
  
  const totalReviews = reviews.length;
  
  // Calculate average rating
  let averageRating = 0;
  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    averageRating = parseFloat((sum / totalReviews).toFixed(1));
  }
  
  // Calculate rating distribution
  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };
  
  reviews.forEach(review => {
    ratingDistribution[review.rating]++;
  });
  
  // Calculate percentages for each rating
  const ratingPercentages = {};
  for (const [rating, count] of Object.entries(ratingDistribution)) {
    ratingPercentages[rating] = totalReviews > 0 
      ? parseFloat(((count / totalReviews) * 100).toFixed(1)) 
      : 0;
  }
  
  return {
    totalReviews,
    averageRating,
    ratingDistribution,
    ratingPercentages,
    verifiedPurchases: reviews.filter(r => r.verifiedPurchase).length
  };
}

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  updateHelpfulVotes,
  getReviewStatistics,
  searchReviews
};