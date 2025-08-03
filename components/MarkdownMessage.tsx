"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

type Props = {
  content: string;
  isDarkMode?: boolean;
  currentColor?: { glow: string; text: string };
};

export default function MarkdownMessage({ content, isDarkMode, currentColor }: Props) {
  return (
    <div
      className={[
        "max-w-[85vw] sm:max-w-4xl px-6 py-4",
        isDarkMode ? "text-gray-200" : "text-gray-800",
      ].join(" ")}
    >
      <div className={`prose max-w-none
                       prose-h1:mt-0 prose-h1:mb-2 prose-h2:mt-3 prose-h2:mb-1
                       prose-pre:rounded-xl prose-pre:p-0 prose-code:px-1 prose-code:py-0.5
                       prose-table:overflow-hidden
                       ${isDarkMode 
                         ? "prose-invert prose-white prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-em:text-gray-200 prose-code:text-gray-200 prose-pre:text-gray-200 prose-blockquote:text-gray-200 prose-li:text-gray-200 prose-td:text-gray-200 prose-th:text-white" 
                         : "prose-zinc prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-700 prose-code:text-gray-700 prose-pre:text-gray-700 prose-blockquote:text-gray-700 prose-li:text-gray-700 prose-td:text-gray-700 prose-th:text-gray-900"
                       }`}>
        <ReactMarkdown
          // GitHub-flavored Markdown (tables, strikethrough, task lists, autolinks)
          remarkPlugins={[remarkGfm]}
          // Allow minimal inline HTML but keep it safe
          rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
          components={{
            h1: ({node, ...props}) => <h1 className="font-bold" {...props} />,
            h2: ({node, ...props}) => <h2 className="font-bold" {...props} />,
            h3: ({node, ...props}) => <h3 className="font-semibold" {...props} />,
            a: ({node, ...props}) => (
              <a className="underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
            ),
            table: ({node, ...props}) => (
              <div className="not-prose overflow-x-auto"><table className="min-w-full" {...props} /></div>
            ),
            th: ({node, ...props}) => <th className={`border px-3 py-2 text-left ${isDarkMode ? "bg-gray-800/60 border-gray-700" : "bg-muted/50 border-gray-200"}`} {...props} />,
            td: ({node, ...props}) => <td className={`border px-3 py-2 align-top ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} {...props} />,
            pre: ({node, ...props}) => <pre className="overflow-x-auto p-4" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
} 