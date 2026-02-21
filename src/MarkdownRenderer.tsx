/**
 * Read-only markdown renderer component.
 *
 * Parses a markdown string into an AST and maps each node to a
 * React Native component. Every tag can be overridden via the
 * `components` prop; unspecified tags fall back to defaults
 * defined in `markdownRendererDefaults.tsx`.
 */

import * as React from 'react';

import type {
	MarkdownComponentMap,
	MarkdownInlineNode,
	MarkdownRendererProps,
} from './markdownCore.types';
import { parseMarkdown } from './markdownParser';
import { DEFAULT_COMPONENTS } from './markdownRendererDefaults';

export default function MarkdownRenderer({ markdown, components, style, features }: MarkdownRendererProps) {
	const blocks = React.useMemo(() => parseMarkdown(markdown, features), [markdown, features]);
	const componentMap: MarkdownComponentMap = React.useMemo(
		() => ({
			...DEFAULT_COMPONENTS,
			...components,
		}),
		[components],
	);

	const RootComponent = componentMap.root;

	return (
		<RootComponent type="root" style={style}>
			{blocks.map((block, blockIndex) => {
				const key = `block-${blockIndex}`;

				if (block.type === 'paragraph') {
					if (block.children.length === 1 && block.children[0]?.type === 'image') {
						const imageNode = block.children[0];
						const ImageComponent = componentMap.image;
						return <ImageComponent key={key} type="image" src={imageNode.src} alt={imageNode.alt} title={imageNode.title} />;
					}

					const ParagraphComponent = componentMap.paragraph;
					return (
						<ParagraphComponent key={key} type="paragraph">
							{renderInlineNodes(block.children, componentMap, key)}
						</ParagraphComponent>
					);
				}

				if (block.type === 'heading') {
					if (block.level === 1) {
						const HeadingComponent = componentMap.heading1;
						return (
							<HeadingComponent key={key} type="heading1" level={1}>
								{renderInlineNodes(block.children, componentMap, key)}
							</HeadingComponent>
						);
					}

					if (block.level === 2) {
						const HeadingComponent = componentMap.heading2;
						return (
							<HeadingComponent key={key} type="heading2" level={2}>
								{renderInlineNodes(block.children, componentMap, key)}
							</HeadingComponent>
						);
					}

					if (block.level === 3) {
						const HeadingComponent = componentMap.heading3;
						return (
							<HeadingComponent key={key} type="heading3" level={3}>
								{renderInlineNodes(block.children, componentMap, key)}
							</HeadingComponent>
						);
					}

					if (block.level === 4) {
						const HeadingComponent = componentMap.heading4;
						return (
							<HeadingComponent key={key} type="heading4" level={4}>
								{renderInlineNodes(block.children, componentMap, key)}
							</HeadingComponent>
						);
					}

					if (block.level === 5) {
						const HeadingComponent = componentMap.heading5;
						return (
							<HeadingComponent key={key} type="heading5" level={5}>
								{renderInlineNodes(block.children, componentMap, key)}
							</HeadingComponent>
						);
					}

					const HeadingComponent = componentMap.heading6;
					return (
						<HeadingComponent key={key} type="heading6" level={6}>
							{renderInlineNodes(block.children, componentMap, key)}
						</HeadingComponent>
					);
				}

				if (block.type === 'codeBlock') {
					const CodeBlockComponent = componentMap.codeBlock;
					return <CodeBlockComponent key={key} type="codeBlock" text={block.content} language={block.language} />;
				}

				if (block.type === 'blockquote') {
					const BlockquoteComponent = componentMap.blockquote;
					return (
						<BlockquoteComponent key={key} type="blockquote">
							{renderInlineNodes(block.children, componentMap, key)}
						</BlockquoteComponent>
					);
				}

				if (block.type === 'horizontalRule') {
					const HorizontalRuleComponent = componentMap.horizontalRule;
					return <HorizontalRuleComponent key={key} type="horizontalRule" />;
				}

				if (block.type === 'spacer') {
					const SpacerComponent = componentMap.spacer;
					return <SpacerComponent key={key} type="spacer" />;
				}

				const ListItemComponent = componentMap.listItem;
				const TextComponent = componentMap.text;

				if (block.ordered) {
					const OrderedListComponent = componentMap.orderedList;
					return (
						<OrderedListComponent key={key} type="orderedList" ordered>
							{block.items.map((item, itemIndex) => {
								const marker = `${itemIndex + 1}. `;

								return (
									<ListItemComponent key={`${key}-item-${itemIndex}`} type="listItem" ordered index={itemIndex}>
										<TextComponent type="text" text={marker}>
											{marker}
											{renderInlineNodes(item, componentMap, `${key}-item-${itemIndex}`)}
										</TextComponent>
									</ListItemComponent>
								);
							})}
						</OrderedListComponent>
					);
				}

				const UnorderedListComponent = componentMap.unorderedList;
				return (
					<UnorderedListComponent key={key} type="unorderedList" ordered={false}>
						{block.items.map((item, itemIndex) => {
							const marker = '- ';

							return (
								<ListItemComponent key={`${key}-item-${itemIndex}`} type="listItem" ordered={false} index={itemIndex}>
									<TextComponent type="text" text={marker}>
										{marker}
										{renderInlineNodes(item, componentMap, `${key}-item-${itemIndex}`)}
									</TextComponent>
								</ListItemComponent>
							);
						})}
					</UnorderedListComponent>
				);
			})}
		</RootComponent>
	);
}

/**
 * Recursively renders an array of inline markdown nodes into React elements.
 * Each node type is mapped to its corresponding component from the component map.
 */
function renderInlineNodes(nodes: MarkdownInlineNode[], components: MarkdownComponentMap, keyPrefix: string): React.ReactNode[] {
	return nodes.map((node, index) => {
		const key = `${keyPrefix}-inline-${index}`;

		if (node.type === 'text') {
			const TextComponent = components.text;
			return (
				<TextComponent key={key} type="text" text={node.content}>
					{node.content}
				</TextComponent>
			);
		}

		if (node.type === 'bold') {
			const BoldComponent = components.bold;
			return (
				<BoldComponent key={key} type="bold">
					{renderInlineNodes(node.children, components, key)}
				</BoldComponent>
			);
		}

		if (node.type === 'italic') {
			const ItalicComponent = components.italic;
			return (
				<ItalicComponent key={key} type="italic">
					{renderInlineNodes(node.children, components, key)}
				</ItalicComponent>
			);
		}

		if (node.type === 'strikethrough') {
			const StrikethroughComponent = components.strikethrough;
			return (
				<StrikethroughComponent key={key} type="strikethrough">
					{renderInlineNodes(node.children, components, key)}
				</StrikethroughComponent>
			);
		}

		if (node.type === 'code') {
			const InlineCodeComponent = components.inlineCode;
			return (
				<InlineCodeComponent key={key} type="inlineCode" text={node.content}>
					{node.content}
				</InlineCodeComponent>
			);
		}

		if (node.type === 'image') {
			const ImageComponent = components.image;
			return <ImageComponent key={key} type="image" src={node.src} alt={node.alt} title={node.title} />;
		}

		const LinkComponent = components.link;
		return (
			<LinkComponent key={key} type="link" href={node.href}>
				{renderInlineNodes(node.children, components, key)}
			</LinkComponent>
		);
	});
}
