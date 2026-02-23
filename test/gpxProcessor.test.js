import { expect } from '@open-wc/testing';
import { 
  formatDistance, 
  formatElevation, 
  formatGradient,
  calculateDistance,
  parseGPX,
  processTrack,
  detectClimbs,
  detectDescents,
  matchClimbs,
  calculateClimbDifficulty
} from '../gpxProcessor.js';

describe('gpxProcessor', () => {
  describe('formatDistance', () => {
    it('formats all distances in km', () => {
      expect(formatDistance(500)).to.equal('0.50 km');
      expect(formatDistance(0)).to.equal('0.00 km');
      expect(formatDistance(1000)).to.equal('1.00 km');
      expect(formatDistance(2500)).to.equal('2.50 km');
      expect(formatDistance(10234)).to.equal('10.23 km');
    });
  });

  describe('formatElevation', () => {
    it('formats elevation with m suffix', () => {
      expect(formatElevation(100)).to.equal('100 m');
      expect(formatElevation(1234)).to.equal('1234 m');
    });

    it('rounds to whole numbers', () => {
      expect(formatElevation(100.7)).to.equal('101 m');
      expect(formatElevation(100.3)).to.equal('100 m');
    });
  });

  describe('formatGradient', () => {
    it('formats gradient as percentage', () => {
      expect(formatGradient(5.0)).to.equal('5.0%');
      expect(formatGradient(12.3)).to.equal('12.3%');
    });

    it('handles negative gradients', () => {
      expect(formatGradient(-8.0)).to.equal('-8.0%');
    });
  });

  describe('calculateDistance', () => {
    it('calculates distance between two coordinates', () => {
      const lat1 = 37.7749; // San Francisco
      const lon1 = -122.4194;
      const lat2 = 37.7849; // ~1.11km north
      const lon2 = -122.4194;
      
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      expect(distance).to.be.closeTo(1112, 10); // ~1.11km with 10m tolerance
    });

    it('returns 0 for same coordinates', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).to.equal(0);
    });
  });

  describe('parseGPX', () => {
    it('parses valid GPX with trackpoints', () => {
      const gpx = `<?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <trkseg>
              <trkpt lat="37.7749" lon="-122.4194">
                <ele>100</ele>
              </trkpt>
              <trkpt lat="37.7750" lon="-122.4195">
                <ele>105</ele>
              </trkpt>
            </trkseg>
          </trk>
        </gpx>`;
      
      const trackpoints = parseGPX(gpx);
      expect(trackpoints).to.have.lengthOf(2);
      expect(trackpoints[0]).to.have.property('lat', 37.7749);
      expect(trackpoints[0]).to.have.property('lon', -122.4194);
      expect(trackpoints[0]).to.have.property('elevation', 100);
    });

    it('throws error for invalid GPX', () => {
      expect(() => parseGPX('not xml')).to.throw();
    });

    it('throws error for GPX without trackpoints', () => {
      const gpx = `<?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
        </gpx>`;
      
      expect(() => parseGPX(gpx)).to.throw('No trackpoints found');
    });
  });

  describe('processTrack', () => {
    it('processes trackpoints and calculates statistics', () => {
      const trackpoints = [
        { lat: 37.7749, lon: -122.4194, elevation: 100 },
        { lat: 37.7750, lon: -122.4195, elevation: 110 },
        { lat: 37.7751, lon: -122.4196, elevation: 120 },
        { lat: 37.7752, lon: -122.4197, elevation: 130 },
      ];
      
      const track = processTrack(trackpoints, { gainThreshold: 0 });
      
      expect(track).to.have.property('distances');
      expect(track).to.have.property('elevations');
      expect(track).to.have.property('stats');
      expect(track.distances).to.have.lengthOf(4);
      expect(track.elevations).to.have.lengthOf(4);
      expect(track.stats.elevationGain).to.be.closeTo(30, 1);
    });

    it('applies smoothing when specified', () => {
      const trackpoints = [
        { lat: 37.7749, lon: -122.4194, elevation: 100 },
        { lat: 37.7750, lon: -122.4195, elevation: 200 },
        { lat: 37.7751, lon: -122.4196, elevation: 100 },
        { lat: 37.7752, lon: -122.4197, elevation: 200 },
        { lat: 37.7753, lon: -122.4198, elevation: 100 },
      ];
      
      const trackNoSmooth = processTrack(trackpoints, { smoothingWindow: 0, gainThreshold: 0 });
      const trackSmooth = processTrack(trackpoints, { smoothingWindow: 3, gainThreshold: 0 });
      
      // Smoothed track should have less elevation gain
      expect(trackSmooth.stats.elevationGain).to.be.lessThan(trackNoSmooth.stats.elevationGain);
    });
  });

  describe('detectClimbs', () => {
    it('detects climbs meeting criteria', () => {
      const distances = [0, 500, 1000, 1500, 2000];
      const elevations = [0, 50, 100, 150, 200];
      
      const climbs = detectClimbs(distances, elevations, {
        minGain: 100,
        minDistance: 500,
        minGradient: 5
      });
      
      expect(climbs).to.have.lengthOf(1);
      expect(climbs[0].gain).to.be.closeTo(200, 1);
    });

    it('returns empty array when no climbs meet criteria', () => {
      const distances = [0, 500, 1000];
      const elevations = [100, 101, 102]; // Too little gain
      
      const climbs = detectClimbs(distances, elevations, {
        minGain: 100,
        minDistance: 500
      });
      
      expect(climbs).to.be.an('array').that.is.empty;
    });
  });

  describe('detectDescents', () => {
    it('detects descents meeting criteria', () => {
      const distances = [0, 500, 1000, 1500, 2000];
      const elevations = [200, 150, 100, 50, 0];
      
      const descents = detectDescents(distances, elevations, {
        minLoss: 100,
        minDistance: 500,
        minGradient: 5
      });
      
      expect(descents).to.have.lengthOf(1);
      expect(descents[0].loss).to.be.closeTo(200, 1);
    });
  });

  describe('matchClimbs', () => {
    it('matches similar climbs between tracks', () => {
      const climbs1 = [{
        gain: 200,
        distance: 2000,
        avgGradient: 10,
        startDistance: 0,
        endDistance: 2000
      }];
      
      const climbs2 = [{
        gain: 210,
        distance: 2100,
        avgGradient: 10,
        startDistance: 0,
        endDistance: 2100
      }];
      
      const matches = matchClimbs(climbs1, climbs2, {
        gainTolerance: 0.25,
        distanceTolerance: 0.25,
        gradientTolerance: 2
      });
      
      expect(matches).to.have.lengthOf(1);
      expect(matches[0]).to.have.property('climb1');
      expect(matches[0]).to.have.property('climb2');
      expect(matches[0]).to.have.property('similarityScore');
    });

    it('does not match climbs outside tolerance', () => {
      const climbs1 = [{
        gain: 200,
        distance: 2000,
        avgGradient: 10,
        startDistance: 0,
        endDistance: 2000
      }];
      
      const climbs2 = [{
        gain: 400, // Too different
        distance: 2000,
        avgGradient: 20,
        startDistance: 0,
        endDistance: 2000
      }];
      
      const matches = matchClimbs(climbs1, climbs2, {
        gainTolerance: 0.25,
        distanceTolerance: 0.25,
        gradientTolerance: 2
      });
      
      expect(matches).to.be.an('array').that.is.empty;
    });
  });

  describe('calculateClimbDifficulty', () => {
    it('calculates difficulty score', () => {
      const climb = {
        gain: 200,
        avgGradient: 10
      };
      
      const difficulty = calculateClimbDifficulty(climb);
      
      expect(difficulty).to.be.a('number');
      expect(difficulty).to.be.greaterThan(0);
    });

    it('returns higher score for harder climbs', () => {
      const easyClimb = { gain: 100, avgGradient: 5 };
      const hardClimb = { gain: 500, avgGradient: 15 };
      
      const easyScore = calculateClimbDifficulty(easyClimb);
      const hardScore = calculateClimbDifficulty(hardClimb);
      
      expect(hardScore).to.be.greaterThan(easyScore);
    });
  });
});
