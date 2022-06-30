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
import { Model, Geometry } from "@luma.gl/core";
import {
    dashShaders,
    offsetShaders,
} from "@deck.gl/extensions/src/path-style/shaders.glsl";
import { dist } from "gl-matrix/vec3";
import { Feature } from "geojson";
import { LineString } from "geojson";
import { zip } from "lodash";
import { distance } from "mathjs";

export default class UnfoldedPathExtention extends LayerExtension {
    isEnabled(layer) {
        return layer.state.pathTesselator;
    }

    // initializeState() {
    //     const { gl } = this.context;
    //     const attributeManager = this.getAttributeManager();
    //     attributeManager.add({
    //         positions: { size: 3, noAlloc: true },
    //         // texCoords: { size: 2, noAlloc: true },
    //     });
    //     this.setState({
    //         model: this._getModel(gl),
    //     });
    // }

    // _getModel(gl) {
    //     const { vertexCount } = this.props;

    //     return new Model(gl, {
    //         ...this.getShaders(),
    //         id: this.props.id,
    //         geometry: new Geometry({
    //             drawMode: GL.TRIANGLES,
    //             attributes: {
    //                 positions: new Float32Array(this.getUnfoldedPath(attribute.positions)),
    //             },
    //         }),
    //         isInstanced: true,
    //     });
    // }

    draw({ uniforms, moduleParameters, context }, extension): void {
        const attributeManager = this.getAttributeManager();
        if (!attributeManager || !extension.isEnabled(this)) {
            // This extension only works with the PathLayer
            return;
        }

        if (context.viewport.constructor.name === "IntersectionViewport") {
            this.state.model.draw({
                attributes: {
                    positions: [0 , 1, 0, -1, 0, -1, 0 , 1, 0, -1, 0, -1],
                },
            });

            // console.log("b", moduleParameters);
            // const mergedModuleParams = {
            //     ...moduleParameters,
            //     data: [
            //         {
            //             ...moduleParameters.data[0],
            //             geometry: {
            //                 ...moduleParameters.data[0].geometry,
            //                 coordinates: [
            //                     [0.0, 2000.0, -400.0],
            //                     [700.0, 2000.0, -600.0],
            //                     [1000.0, 2000.0, -400.0],
            //                 ],
            //             },
            //         },
            //     ],
            // };
            // console.log("a", mergedModuleParams);
            // this.setModuleParameters(mergedModuleParams);
            // this.draw(
            //     {
            //         uniforms: uniforms,
            //         moduleParameters: mergedModuleParams,
            //         context: context,
            //     },
            //     extension
            // );
        }
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
        return vAbscissa;
    }
}

UnfoldedPathExtention.extensionName = "UnfoldedPathExtention";
