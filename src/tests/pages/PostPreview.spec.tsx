import { render, screen } from '@testing-library/react';
import { getPrismicClient } from '../../services/prismic';
import PostPreview, { getStaticProps } from '../../pages/posts/preview/[slug]';
import { useSession } from 'next-auth/client';
import { useRouter } from 'next/router';

const post = {
    slug: 'my-new-post',
    title: 'My New Post',
    content: '<p>Post excerpt</p>',
    updatedAt: '10 de Abril'
};

jest.mock('next-auth/client');
jest.mock('next/router');
jest.mock('../../services/prismic');

describe('Post preview page', () => {
    it('renders correctly', () => {
        const useSessionMocked = jest.mocked(useSession);
        useSessionMocked.mockReturnValueOnce([null, false]);

        render(<PostPreview post={post} />);

        expect(screen.getByText('My New Post')).toBeInTheDocument();
        expect(screen.getByText('Post excerpt')).toBeInTheDocument();
        expect(screen.getByText('Wanna continue reading?')).toBeInTheDocument();
    });

    it('redirects user to full post when user is subscribed', async () => {
        const useSessionMocked = jest.mocked(useSession);
        const useRouterMocked = jest.mocked(useRouter);
        const pushMock = jest.fn();

        useSessionMocked.mockReturnValueOnce([
            { activeSubscription: 'fake-active-subscription' },
            false
        ] as any);

        useRouterMocked.mockReturnValueOnce({
            push: pushMock
        } as any);

        render(<PostPreview post={post} />);

        expect(pushMock).toHaveBeenCalledWith('/posts/my-new-post');
    });

    it('loads initial data', async () => {
        const getPrismicClientMoked = jest.mocked(getPrismicClient);

        getPrismicClientMoked.mockReturnValueOnce({
            getByUID: jest.fn().mockReturnValueOnce({
                data: {
                    title: [
                        { type: 'heading', text: 'My New Post' }
                    ],
                    content: [
                        { type: 'paragraph', text: 'Post content' }
                    ]
                },
                last_publication_date: '04-01-2022'
            })
        } as any);

        const response = await getStaticProps({
            params: { slug: 'my-new-post' }
        } as any);

        expect(response).toEqual(
            expect.objectContaining({
                props: {
                    post: {
                        slug: 'my-new-post',
                        title: 'My New Post',
                        content: '<p>Post content</p>',
                        updatedAt: '01 de abril de 2022'
                    }
                }
            })
        )
    });
})