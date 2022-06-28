import { PathLayer, PathLayerProps } from "@deck.gl/layers";
import { Feature } from "geojson";
import { LineString } from "geojson";
import unfoldedPathShaderVsGlsl from "./unfoldedPathShader.vs.glsl";
import { zip } from "lodash";
import { distance } from "mathjs";

function getUnfoldedPath(object: Feature) {
    const worldCoordinates = (object.geometry as LineString).coordinates;
    const z = worldCoordinates.map((v) => v[2]);
    const delta = worldCoordinates.map((v, i, coordinates) => {
        const prev = coordinates[i - 1] || v;
        return distance([prev[0], prev[1]], [v[0], v[1]]);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any[] = [];
    delta.forEach((d) => {
        const prev = a.at(-1) || 0;
        a.push(d + prev);
    });
    const planeY = 2000;
    const vAbscissa = zip(a, [...a].fill(planeY), z);

    return vAbscissa;
}

interface UnfoldedPathLayerProps<D> extends PathLayerProps<D> {
    isIntersectionView?: boolean;
}

class UnfoldedPathLayer<D = Feature> extends PathLayer<
    D,
    UnfoldedPathLayerProps<D>
> {
    // getShaders(): any {
    //     const parentShaders = super.getShaders();
    //     // use either vertex shader or inject
    //     // vertex shader supports position modification in world space and
    //     // inject vs:DECKGL_FILTER_GL_POSITION allows modification in clip space
    //     return {
    //         ...parentShaders,
    //         vs: unfoldedPathShaderVsGlsl,
    //         // inject: {
    //         //     "vs:DECKGL_FILTER_GL_POSITION": `
    //         //         position.y = position.y * 0.5;
    //         //     `,
    //         // },
    //     };
    // }
}

export default UnfoldedPathLayer;
UnfoldedPathLayer.layerName = "UnfoldedPathLayer";
