import { render, screen } from '@testing-library/react';
import { getPrismicClient } from '../../services/prismic';
import Post, { getServerSideProps } from '../../pages/posts/[slug]';
import { getSession } from 'next-auth/client';

const post = {
    slug: 'my-new-post',
    title: 'My New Post',
    content: '<p>Post excerpt</p>',
    updatedAt: '10 de Abril'
};

jest.mock('next-auth/client');
jest.mock('../../services/prismic');

describe('Post page', () => {
    it('renders correctly', () => {
        render(<Post post={post} />);

        expect(screen.getByText('My New Post')).toBeInTheDocument();
        expect(screen.getByText('Post excerpt')).toBeInTheDocument();
    });

    it('redirects user if no subscription is found', async () => {
        const getSessionMocked = jest.mocked(getSession);
        getSessionMocked.mockReturnValueOnce(null);

        const response = await getServerSideProps({
            params: { slug: 'my-new-post' }
        } as any);

        expect(response).toEqual(
            expect.objectContaining({
                redirect: expect.objectContaining({
                    destination: '/',
                })
            })
        );
    });

    it('loads initial data', async () => {
        const getSessionMocked = jest.mocked(getSession);
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

        getSessionMocked.mockReturnValueOnce({
            activeSubscription: 'fake-subscription'
        } as any);

        const response = await getServerSideProps({
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