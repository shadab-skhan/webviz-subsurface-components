import { OrthographicController, View, Viewport } from "@deck.gl/core";

import { Matrix4 } from "@math.gl/core";
import { pixelsToWorld } from "@math.gl/web-mercator";

// Displaying in 2d view XZ plane by configuring the view matrix
const viewMatrix = new Matrix4().lookAt({
    eye: [0, 1, 0],
    up: [0, 0, 1],
    //center: [0, 0, 0],
});

function getProjectionMatrix({ width, height, near, far }) {
    // Make sure Matrix4.ortho doesn't crash on 0 width/height
    width = width || 1;
    height = height || 1;

    return new Matrix4().ortho({
        left: -width / 2,
        right: width / 2,
        bottom: -height / 2,
        top: height / 2,
        near,
        far,
    });
}

class IntersectionViewport extends Viewport {
    constructor(props) {
        const {
            width,
            height,
            near = 0.1,
            far = 1000,
            zoom = 0,
            target = [0, 0, 0],
            flipY = true,
        } = props;
        const zoomX = Array.isArray(zoom) ? zoom[0] : zoom;
        const zoomY = Array.isArray(zoom) ? zoom[1] : zoom;
        const zoomZ = Array.isArray(zoom) ? zoom[2] : zoom;
        const zoom_ = Math.min(zoomX, zoomY, zoomZ);
        const scale = Math.pow(2, zoom_);

        let distanceScales;
        if (zoomX !== zoomY) {
            const scaleX = Math.pow(2, zoomX);
            const scaleY = Math.pow(2, zoomY);
            const scaleZ = Math.pow(2, zoomZ);

            distanceScales = {
                unitsPerMeter: [scaleX / scale, scaleY / scale, scaleZ / scale],
                metersPerUnit: [scale / scaleX, scale / scaleY, scale / scaleZ],
            };
        }

        super({
            ...props,
            // in case viewState contains longitude/latitude values,
            // make sure that the base Viewport class does not treat this as a geospatial viewport
            longitude: null,
            position: target,
            viewMatrix: viewMatrix
                .clone()
                .scale([scale, scale * (flipY ? -1 : 1), scale]),
            projectionMatrix: getProjectionMatrix({ width, height, near, far }),
            zoom: zoom_,
            distanceScales,
        });
    }

    /**
     * Common space:
     * To correctly compose data from various world spaces together,
     * deck.gl transforms them into common space - a unified, intermediate 3D space
     * that is a right-handed Cartesian coordinate system. Once positions are in the common space,
     * it is safe to add, substract, rotate, scale and extrude them as 3D vectors using standard linear algebra.
     * This is the basis of all geometry processing in deck.gl layers.
     *
     * The transformation between the world space and the common space is referred
     * to in deck.gl documentation as "project" (world space to common space) and
     * "unproject" (common space to world space), a process controlled by both the specification of the world space,
     * such as WGS84, and the projection mode, such as Web Mercator.
     * Projections are implemented as part of deck.gl's core.
     * More info here:
     * https://deck.gl/docs/developer-guide/coordinate-systems#:~:text=same%203D%20view.-,Common%20space,-To%20correctly%20compose
     * Trying to return X and hardcoded Z value
     */

    /**
     * Projects xyz (possibly latitude and longitude) to pixel coordinates in window
     * using viewport projection parameters
     * - [longitude, latitude] to [x, y]
     * - [longitude, latitude, Z] => [x, y, z]
     */
    project(xyz, { topLeft = true } = {}) {
        const [X, Y, Z] = super.project(xyz, topLeft);
        return [X, 0, 400];
    }

    /**
     * Unproject pixel coordinates on screen onto world coordinates,
     * (possibly [lon, lat]) on map.
     */
    // unproject(xyz, { topLeft = true, targetZ } = {}) {
    // }

    /**
     * Projects latitude, longitude (and altitude) to coordinates in the common space.
     * - Not required
     */
    // projectPosition(xyz) {
    // }

    // unprojectPosition(xyz) {
    // }

    /**
     * Project [lng,lat] on sphere onto [x,y] on 512*512 Mercator Zoom 0 tile.
     * Performs the nonlinear part of the web mercator projection.
     * Remaining projection is done with 4x4 matrices which also handles
     * perspective.
     */
    // projectFlat([X, Y, Z]) {
    // }

    /**
     * Unproject world point [x,y] on map onto {lat, lon} on sphere
     *
     */
    // unprojectFlat([x, y, z]) {
    // }
}

export default class IntersectionView extends View {
    constructor(props) {
        super({
            ...props,
            type: IntersectionViewport,
        });
    }

    get controller() {
        return this._getControllerProps({
            type: OrthographicController,
        });
    }
}

IntersectionView.displayName = "IntersectionView";
