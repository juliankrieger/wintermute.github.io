import { GetStaticPaths, GetStaticProps } from 'next';
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import imageSize from 'rehype-img-size';

import { getPostWithId as getPostWithSlug, getSortedPostsData } from '../../lib/postData';
import { Post as PostT } from '../../types/Post';
import style from './blog.module.scss';
import { MarkdownImage } from '../../components/Image';
import React from 'react';

import rehypePrism from 'rehype-prism';

interface PostProps {
  post: PostT,
  source: MDXRemoteSerializeResult<Record<string, unknown>>
}

interface MDXRemoteImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function Post({ post, source }: PostProps) {

  return (
    <div>
      <h1>
        {post.title}
        {post.draft && <span style={{float: 'right'}}>[DRAFT]</span>}
      </h1>
      <div
        className={style.paragraph}
      >
        <MDXRemote {...source} components={{
          img: (props: MDXRemoteImageProps) => {

            const {alt: options, ...restProps} = props;
            return <MarkdownImage {...restProps} options={options}></MarkdownImage>
          },
          code: (props: React.HTMLProps<HTMLDivElement>) => {
            const {className} = props;
            const newCl = className ?? "language-any";
            return <code {...props} className={newCl}></code>
          },
          pre: (props: React.HTMLProps<HTMLPreElement>) => {
            const {className} = props;
            const newCl = className ?? "language-any";
            return <pre {...props} className={newCl}></pre>
          },
        }} />
      </div>
        
    </div>
  )
}

// This function gets called at build time
export const getStaticPaths: GetStaticPaths = async () => {
  // Call an external API endpoint to get posts
  const posts = getSortedPostsData();

  // Get the paths we want to pre-render based on posts
  const paths = posts.filter(post => {
    if(process.env.NODE_ENV === 'production') {
      return !post.draft
    }
    return true;
  }).map((post) => ({
    params: { slug: post.slug }
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

// This also gets called at build time
export const getStaticProps: GetStaticProps = async (context) => {

  const { params } = context;

  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1
  let post;
  let source;
  if (params?.slug) {
    post = getPostWithSlug(params.slug as string);
    if (post && post.content) {
      source = await serialize(post.content, {
        mdxOptions: {
          // @ts-ignore
          rehypePlugins: [
            [imageSize, { dir: "public" }],
            [rehypePrism]
          ],
        }
      });
    }
  }
  // Pass post data to the page via props
  return { props: { post, source } }
}

export default Post
