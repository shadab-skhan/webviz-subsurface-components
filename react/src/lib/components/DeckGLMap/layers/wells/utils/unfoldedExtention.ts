// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { LayerExtension, _mergeShaders as mergeShaders } from "@deck.gl/core";
import GL from "@luma.gl/constants";
import {
    dashShaders,
    offsetShaders,
} from "@deck.gl/extensions/src/path-style/shaders.glsl";
import { dist } from "gl-matrix/vec3";
import { Feature } from "geojson";
import { LineString } from "geojson";
import { zip } from "lodash";
import { distance } from "mathjs";

function getUnfoldedPath(object) {
    if (!object) return null;
    const worldCoordinates = object; //(object.geometry as LineString).coordinates;
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

    (object.geometry as LineString).coordinates = vAbscissa;

    // return object.clone({
    //     geometry: {
    //         ...object.geometry,
    //         coordinates: vAbscissa,
    //     },
    // });
    return object;
}

export default class UnfoldedPathExtention extends LayerExtension {
    isEnabled(layer) {
        return layer.state.pathTesselator;
    }

    initializeState(context, extension) {
        const attributeManager = this.getAttributeManager();
        if (!attributeManager || !extension.isEnabled(this)) {
            // This extension only works with the PathLayer
            return;
        }

        extension.enabled = true;
        attributeManager.addInstanced({
            positions: {
                size: 3,
                // Start filling buffer from 1 vertex in
                vertexOffset: 1,
                type: GL.DOUBLE,
                fp64: this.use64bitPositions(),
                accessor: "getPath",
                transform: extension.getUnfoldedPath.bind(this),
                shaderAttributes: {
                    instanceLeftPositions: {
                        vertexOffset: 0,
                    },
                    instanceStartPositions: {
                        vertexOffset: 1,
                    },
                    instanceEndPositions: {
                        vertexOffset: 2,
                    },
                    instanceRightPositions: {
                        vertexOffset: 3,
                    },
                },
            },
        });
    }

    getUnfoldedPath(path) {
        if (!path) return null;
        const z = path.map((v) => v[2]);
        const delta = path.map((v, i, coordinates) => {
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
        console.log(vAbscissa);
        return vAbscissa;
    }
}

UnfoldedPathExtention.extensionName = "UnfoldedPathExtention";
