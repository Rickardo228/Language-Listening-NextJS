'use client';
import { useEffect } from "react";
import Image from 'next/image';

export const AutumnLeaves = ({ fullScreen }: { fullScreen?: boolean; }) => {

    useEffect(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = document.body.clientWidth;
                canvas.height = document.body.clientHeight;

                const width = canvas.width;
                const height = canvas.height;
                const leaf: HTMLImageElement = document.querySelector('#leaf') as HTMLImageElement;

                if (leaf) {
                    const leafs: {
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        v: number;
                        a: number;
                        d: number;
                    }[] = [];
                    const count = 10;

                    for (let i = 0; i < count; i++) {
                        const angle = 15 + Math.random() * 30;
                        const dir = [-1, 1][Math.floor(Math.random() * 2)];

                        leafs.push({
                            x: Math.random() * width,
                            y: Math.random() * height,
                            w: 30,
                            h: 30 * (leaf.height / leaf.width),
                            v: 20 / angle,
                            a: angle,
                            d: dir
                        });
                    }

                    function update() {
                        for (let i = 0; i < leafs.length; i++) {
                            leafs[i].y += leafs[i].v;

                            if (leafs[i].y > height) {
                                leafs[i].y = -120;
                                leafs[i].x = Math.random() * width;
                            }
                        }
                    }

                    function draw(dt?: number) {
                        requestAnimationFrame(draw);
                        update();
                        if (ctx) {

                            ctx.clearRect(0, 0, width, height);

                            for (let i = 0; i < leafs.length; i++) {
                                ctx.save();

                                ctx.translate(leafs[i].x, leafs[i].y);

                                ctx.rotate(leafs[i].d * Math.sin((dt ?? 1) * 0.002 * i * 0.01) * leafs[i].a * Math.PI / 180);

                                ctx.globalAlpha = Math.max(0.1, leafs[i].y * 0.05);
                                ctx.drawImage(leaf, -leafs[i].w / 2, 70, leafs[i].w, leafs[i].h);

                                ctx.restore();
                            }
                        }
                    }
                    draw();
                }

            }

        }

    }, [fullScreen]);

    return (<>
        <canvas style={{ position: fullScreen ? 'fixed' : 'static', display: 'block', height: '100vh', width: '100%', }} width="460" height="320"></canvas>

        <Image id="leaf" style={{ display: 'none' }} src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgc3R5bGU9Imlzb2xhdGlvbjppc29sYXRlIiB2aWV3Qm94PSIwIDAgMjYgMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIxMiI+PGRlZnM+PGNsaXBQYXRoIGlkPSJfY2xpcFBhdGhfRkN4bE4yZHJvS0JYTXlwQmZ2VnM3ejNpSGdlU3hGSngiPjxyZWN0IHdpZHRoPSIyNiIgaGVpZ2h0PSIxMiIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNfY2xpcFBhdGhfRkN4bE4yZHJvS0JYTXlwQmZ2VnM3ejNpSGdlU3hGSngpIj48cGF0aCBkPSIgTSAxNC45OTIgMTEuNzExIEMgMTAuNDUgMTIuNDIyIDUuNDczIDEwLjk4MiAwLjA2MSA3LjM5IFEgMy45NzIgMS41MTUgMTEuNzAxIDAuMTQxIEMgMTUuODkzIC0wLjEyNiAyMC43ODQgMS40OTYgMjUuOTM5IDQuODczIFEgMjEuODQ5IDkuNjg4IDE4Ljk5MiAxMS43MTEgWiAiIGZpbGw9InJnYigyMjIsODgsNTEpIi8+PC9nPjwvc3ZnPg==" alt="Autumn leaf" width={26} height={12} />
    </>);
};
