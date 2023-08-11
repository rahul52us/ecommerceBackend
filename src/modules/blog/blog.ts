import { NextFunction, Response } from "express";
import { createBlogValidation } from "./utils/validation";
import { generateError } from "../config/function";
import Blog from "../../schemas/Blog/BlogSchema";
import CommentBlog from "../../schemas/Blog/BlogCommentSchema";

const createBlog = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { error, value } = createBlogValidation.validate(req.body);

    if (error) {
      throw generateError(error.details, 422);
    }

    const createdBlog = new Blog({
      coverImage: value.coverImage,
      title: value.title,
      content: value.content,
      tags: value.tags,
      status: value.status,
      createdBy: req.userId,
      organisation: req.bodyData.organisation,
    });

    const savedBlog = await createdBlog.save();

    res.status(201).send({
      data: savedBlog,
      success: true,
      statusCode: 201,
      message: `${value.title} blog has been created successfully`,
    });
  } catch (err: any) {
    next(err);
  }
};

const getBlogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page || 1;
    const perPage = 10;

    const totalCount = await Blog.countDocuments({
      organisation: req.bodyData.organisation,
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const blogs = await Blog.find({ organisation: req.bodyData.organisation })
      .populate({ path: "createdBy", select: "-password" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.status(200).send({
      message: "GET BLOGS SUCCESSFULLY",
      statusCode: 200,
      data: {
        totalPages: totalPages,
        data: blogs,
        currentPage: page,
      },
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

const deleteBlogById = async (req: any, res: Response, next: NextFunction) => {
  try {
    await Blog.findByIdAndDelete(req.params.blogId);
    res.status(200).send({
      message: "BLOG HAS BEEN DELETED SUCCESSFULLY",
      data: "BLOG HAS BEEN DELETED SUCCESSFULLY",
      statusCode: 200,
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

const getBlogById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      throw generateError(`BLOG DOES NOT EXISTS`, 400);
    }
    res.status(200).send({
      message: "GET BLOG SUCCESSFULLY",
      data: blog,
      statusCode: 200,
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

const createNewComment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const instance = new CommentBlog({
      user: req.userId,
      organisation: req.bodyData.organisation,
      blog: req.body.blogId,
      content: req.body.content,
      parentComment: req.body.parentComment,
    });
    const savedBlog = await instance.save();
    res.status(201).send({
      message: "COMMENT CREATED SUCCESSFULLY",
      data: savedBlog,
      success: true,
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

const getComments = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page || 1;
    const pageSize = 10;
    const comments = await CommentBlog.find({ blog: req.params.blogId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({
        path: "user",
        select: "name username",
      })
      .populate({
        path: "replies",
        populate: {
          path: "user",
          select: "name username",
        },
      });

    res.status(200).send({
      message: "GET COMMENTS SUCCESSFULLY",
      data: comments,
      statusCode: 200,
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

export {
  createBlog,
  getBlogs,
  getBlogById,
  deleteBlogById,
  createNewComment,
  getComments,
};